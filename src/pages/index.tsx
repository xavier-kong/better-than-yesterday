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

const itemTypes = ['time', 'duration', 'amount', 'consistency'] as const;

type ItemType = typeof itemTypes[number];

const directions = ['increase', 'decrease'] as const;

type Directions = typeof directions[number];

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [formItemName, setFormItemName] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>();
  const [selectedDirection, setSelectedDirection] = useState<Directions>('increase');
  const userItemsQuery = api.user.fetchUserData.useQuery();
  const createItemsMutation = api.item.createItem.useMutation();
  const [addItemDialogOpen, setAddItemDialogOpen] = useState<boolean>(false);
  const [addItemError, setAddItemError] = useState<string>('');
  const [addItemLoading, setAddItemLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (createItemsMutation.isSuccess) {
      setAddItemDialogOpen(false);
      setAddItemLoading(false);
      setFormItemName('');
      setSelectedItemType(null);
      setSelectedDirection('increase');
      setAddItemError('');
      toast({
        description: 'Item has been created successfully.',
      })
    } else if (createItemsMutation.isError) {
      setAddItemLoading(false);
      setAddItemError(createItemsMutation.error.message);
    }
  }, [createItemsMutation.isLoading, createItemsMutation.isSuccess, createItemsMutation.isError, createItemsMutation.error?.message, toast]);

  if (!isLoaded) {
    return <Spinner />;
  }

  if (!isSignedIn || !userId) {
    return (<div className="flex min-h-screen items-center justify-center"><SignIn /></div>)
  }

  if (userItemsQuery.isLoading) {
    return <Spinner />;
  }


  const userItems = userItemsQuery.data?.items;

  const handleAddItem = () => {
    if (!formItemName) {
      setAddItemError('Please enter a name.');
      return;
    }

    if (!selectedItemType) {
      setAddItemError('Please select item type.');
      return;
    }

    const itemExists = userItems?.some(item => item.itemName.toLowerCase() === formItemName.toLowerCase());

    if (itemExists) {
      setAddItemError('Name already taken. Try another.');
      return;
    }

    createItemsMutation.mutate({
      itemType: selectedItemType,
      itemName: formItemName,
      direction: selectedDirection
    })

    setAddItemLoading(true);
  }


  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen items-center justify-center">
        <div className="justify-center items-center flex container">
          <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
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
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        itemTypes.map((itemType) => (
                          <SelectItem value={itemType} key={itemType} onSelect={() => setSelectedItemType(itemType)}
                          >
                            {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="direction" className="text-right">
                    Direction
                  </Label>
                  <RadioGroup defaultValue="increase" className="flex flex-row col-span-3 ml-2">
                    {
                      directions.map((dir) => (
                        <div className="flex items-center space-x-2" key={dir} onSelect={() => setSelectedDirection(dir)}>
                          <RadioGroupItem value={dir} id={dir} />
                          <Label htmlFor={dir}>{dir.charAt(0).toUpperCase() + dir.slice(1)}</Label>
                        </div>
                      ))
                    }
                  </RadioGroup>
                </div>
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
