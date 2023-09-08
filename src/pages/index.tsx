import Head from "next/head";
import { useAuth, SignIn } from "@clerk/nextjs";
import { api } from "~/utils/api";
import Spinner from "../components/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { useToast } from "~/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { ClockIcon, Crosshair, TimerIcon, TargetIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip'

const itemTypes = ['time', 'duration', 'amount', 'consistency'] as const;

type ItemType = typeof itemTypes[number];

const directions = ['increase', 'decrease'] as const;

type Directions = typeof directions[number];

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

type RouterOutput = inferRouterOutputs<AppRouter>;
type Items = RouterOutput["user"]["fetchUserData"]["items"];

function ItemNameIcon({ itemType, direction }: {itemType: ItemType; direction?: Directions | null}) {
  let color = 'green';
  if (direction === 'decrease') {
    color = 'red';
  } else if (itemType === 'consistency') {
    color = 'white';
  }
  const size = 24;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {
            itemType === 'time'
              ?  <ClockIcon color={color} size={size} />
              : itemType === 'duration' 
                ?  <TimerIcon color={color} size={size} />
                : itemType === 'amount'
                  ? <TargetIcon color={color} size={size} />
                  :  <Crosshair color={color} size={size} />
          }
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">{itemType} {itemType === 'consistency' ? null : direction}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )


}

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [formItemName, setFormItemName] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<ItemType | undefined>();
  const [selectedDirection, setSelectedDirection] = useState<Directions>('increase');
  const userItemsQuery = api.user.fetchUserData.useQuery();
  const createItemsMutation = api.item.createItem.useMutation();
  const [addItemDialogOpen, setAddItemDialogOpen] = useState<boolean>(false);
  const [addItemError, setAddItemError] = useState<string>('');
  const [addItemLoading, setAddItemLoading] = useState<boolean>(false);
  const [items, setItems] = useState<Items>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (createItemsMutation.isSuccess) {
      setAddItemDialogOpen(false);
      setAddItemLoading(false);
      clearFields();
      toast({
        description: 'Item has been created successfully.',
      })
    } else if (createItemsMutation.isError) {
      setAddItemLoading(false);
      setAddItemError(createItemsMutation.error.message);
    }
  }, [createItemsMutation.isLoading, createItemsMutation.isSuccess, createItemsMutation.isError, createItemsMutation.error?.message, toast]);

  useEffect(() => {
    if (userItemsQuery.isLoading) {
      setLoading(true);
    } else if (userItemsQuery.isSuccess) {
      setLoading(false);
      const userItems = userItemsQuery.data.items;
      setItems(userItems);
    }
  }, [userItemsQuery.isLoading, userItemsQuery.isSuccess, userItemsQuery.data?.items]);

  if (!isLoaded || loading) {
    return <Spinner />;
  }

  if (!isSignedIn || !userId) {
    return (<div className="flex min-h-screen items-center justify-center"><SignIn /></div>)
  }

  const clearFields = () => {
    setFormItemName('');
    setSelectedItemType(undefined);
    setSelectedDirection('increase');
    setAddItemError('');
  }

  const handleAddItem = () => {
    if (!formItemName) {
      setAddItemError('Please enter a name.');
      return;
    }

    if (!selectedItemType) {
      setAddItemError('Please select item type.');
      return;
    }

    const itemExists = items?.some(item => item.itemName.toLowerCase() === formItemName.toLowerCase());

    if (itemExists) {
      setAddItemError('Name already taken. Try another.');
      return;
    }

    const newItem = {
      itemType: selectedItemType,
      itemName: formItemName,
      direction: selectedDirection
    };

    createItemsMutation.mutate(newItem)

    const currItems = items;
    currItems.push(newItem)

    setAddItemLoading(true);
  }

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen items-center justify-center flex-col">
        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Item</TableHead>
                <TableHead>Yesterday</TableHead>
                <TableHead>Today</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                items?.map((item) => (
                  <TableRow key={item.itemName}>
                    <TableCell className="flex flex-row gap-4">
                      <div className="flex-1">{item.itemName}</div>
                      <ItemNameIcon itemType={item.itemType} direction={item.direction} />
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
        <div className="justify-center items-center flex container">
          <Dialog open={addItemDialogOpen} onOpenChange={() => {
            if (addItemDialogOpen) {
              clearFields();
            }
            setAddItemDialogOpen(!addItemDialogOpen)
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">Add Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
                <DialogDescription>
                  Add a new item. Click save.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" value={formItemName} onChange={(e) => setFormItemName(e.currentTarget.value)} className="col-span-3" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select 
                    value={selectedItemType} 
                    onValueChange={(val: ItemType) => setSelectedItemType(val)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        itemTypes.map((itemType: ItemType) => (
                          <SelectItem value={itemType} key={itemType} className="capitalize">
                            {capitalize(itemType)}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {
                  selectedItemType !== 'consistency' ?
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="direction" className="text-right">
                        Direction
                      </Label>
                      <RadioGroup defaultValue="increase" className="flex flex-row col-span-3 ml-2" value={selectedDirection} onValueChange={(val: Directions) => setSelectedDirection(val)}>
                        {
                          directions.map((dir) => (
                            <div className="flex items-center space-x-2" key={dir} onSelect={() => setSelectedDirection(dir)}>
                              <RadioGroupItem value={dir} id={dir} />
                              <Label htmlFor={dir} className="capitalize">{dir}</Label>
                            </div>
                          ))
                        }
                      </RadioGroup>
                    </div> : null
                }
              </div>

              <DialogFooter>
                <div className="flex flex-row justify-between w-full items-center">
                  <div>
                    <p className="text-red-500">{addItemError}</p>
                  </div>
                  <Button type="submit" onClick={() => handleAddItem()} className="justify-center" disabled={addItemLoading}>
                    {addItemLoading ? <Spinner /> : 'Add'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </>
  );
}
