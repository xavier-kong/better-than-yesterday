import Head from "next/head";
import { useAuth, SignIn, UserButton } from "@clerk/nextjs";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";
import { ClockIcon, Crosshair, TimerIcon, TargetIcon, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import Link from 'next/link';

const itemTypes = ['time', 'duration', 'amount', 'consistency'] as const;

type ItemType = typeof itemTypes[number];

const directions = ['increase', 'decrease'] as const;

type Directions = typeof directions[number];

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

interface HandleLogBody {
  itemType: ItemType;
  itemId: number;
  value?: number;
  logId?: number;
};

type RouterOutput = inferRouterOutputs<AppRouter>;
type Items = RouterOutput["user"]["fetchUserData"]["items"];
type SingleItem = Items[number];

function ItemNameIcon({ itemType }: {itemType: ItemType}) {
  const color= 'white'
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
          <p className="capitalize">{itemType}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function interconvertTimeString(value: number | string) {
  if (typeof value === 'number') {
    const totalMinutes = Math.floor(value / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else if (typeof value === 'string') {
    const parts = value.split(':');
    if (!parts[0] || !parts[1]) { return 0; }
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    return (hours * 60 * 60) + (minutes * 60);
  }
}

function ItemDiff({ item }: { item: SingleItem }) {
  if (!item.logs.today) {
    return <div></div>;
  }

  if (item.itemType === 'time') {

  } else if (item.itemType === 'amount') {

    if (!item.logs.ytd?.value || !item.logs.today.value) {
      return <div>N/A</div>;
    }

    const diff = item.logs.today.value - item.logs.ytd.value;

    const color = (item.direction === 'increase' ? (diff >= 0) : (diff <= 0)) ? 'green-500' : 'red-500';

    return <div className={`text-${color} text-lg`}>{diff}</div>

  } else if (item.itemType === 'duration') {

    if (!item.logs.ytd?.value || !item.logs.today.value) {
      return <div>N/A</div>;
    }

    const diff = item.logs.today.value - item.logs.ytd.value;

    const color = (item.direction === 'increase' ? (diff >= 0) : (diff <= 0)) ? 'green-500' : 'red-500';

    return <div className={`text-${color} text-lg`}>{interconvertTimeString(Math.abs(diff))}</div>

  } else if (item.itemType === 'consistency') {

    if (!item.logs.today.value || !item.logs.ytd?.value) {

    }
  }
}

function ItemYtd({ item }: { item: SingleItem }) {
  const { itemType, logs } = item;

  if (!logs.ytd || Object.keys(logs?.ytd).length === 0) {
    return <div>N/A</div>;
  }

  if (itemType === 'duration') {
    if (!logs.ytd.value) {
      return <div>N/A</div>;
    }
    return <div className="text-lg">{interconvertTimeString(logs.ytd.value)}</div>
  } else if (itemType === 'amount') {
    if (!logs.ytd.value) {
      return <div>N/A</div>;
    }
    return <div className="text-lg">{logs.ytd.value}</div>;
  } else if (itemType === 'time') {
    if (!logs.ytd.createdAt) {
      return <div>N/A</div>;
    }
    return (
      <div className="flex-row flex justify-center items-center">
        <div className="flex flex-1 text-lg">{logs.ytd.createdAt.toLocaleTimeString()}</div>
        <div className="flex"><CheckCircle2 color="green" /></div>
      </div>
    );
  } else if (itemType === 'consistency') {
    if (!logs.ytd.createdAt) {
      return <div>N/A</div>;
    }
    return (
      <div className="flex-row flex justify-center items-center">
        <div className="flex flex-1 text-lg">Done</div>
        <div className="flex"><CheckCircle2 color="green" /></div>
      </div>
    );
  }
  return <div></div>
}

function ItemLogger({ item, handleLog }: {item: SingleItem; handleLog: (body: HandleLogBody) => void; }) {
  const [logDurationSecs, setLogDurationSecs] = useState<number>(0);
  const { itemType, itemId, logs } = item;

  useEffect(() => {
    if (itemType === 'duration') {
      if (logs.today?.value) {
        setLogDurationSecs(logs.today.value);
      } 
    }
  }, [logs.today?.value]);

  if (itemType === 'duration') {
    return (
      <div className='h-6 text-lg flex flex-row'>
        <Input type="number" className="border-b border-t-0 border-l-0 border-r-0 border-white rounded-none w-12 h-7 mx-3"/>
        <p>H</p>
        <Input type="number" className="border-b border-t-0 border-l-0 border-r-0 border-white rounded-none w-12 h-7 mx-3"/>
        <p>M</p>
        {/*<Input type="time" value={interconvertTimeString(logDurationSecs)} 
          onBlur={() => handleLog({ itemType, itemId, value: logDurationSecs, logId: logs.today?.logId })}
          onChange={e => {
            const timeStr = e.currentTarget.value;
            const secs = interconvertTimeString(timeStr) as number;
            setLogDurationSecs(secs);
          }} />*/}
      </div>
    )
  } else if (itemType === 'consistency') {
    return (
      <div>
        {
          logs.today && Object.keys(logs.today).length > 0 ? 
            <div className="flex-row flex justify-center items-center">
              <div className="flex flex-1 text-lg">Done</div>
              <div className="flex"><CheckCircle2 color="green" /></div>
            </div>
            : <Button className="text-lg" onClick={() => handleLog({ itemType, itemId })}>Mark Done</Button>
        }
      </div>
    );

  } else if (itemType === 'time') {
    return (
      <div>
        {
          logs.today?.createdAt ? 
            <div className="flex-row flex justify-center items-center">
              <div className="flex flex-1 text-lg">{logs.today.createdAt.toLocaleTimeString()}</div>
              <div className="flex"><CheckCircle2 color="green" /></div>
            </div>
            : <Button className="text-lg" onClick={() => handleLog({ itemType, itemId })}>Log Time</Button>
        }
      </div>
    );
  } else if (itemType === 'amount') {
    return (
      <div className="flex flex-row w-28">
        <div className="flex flex-1 items-center">
          <p className="text-lg">
            {
              logs?.today?.value ?? 0
            }
          </p>
        </div>
        <div className="flex flex-1 justify-center items-center"><Button className="text-lg" onClick={() => handleLog({ itemType, itemId, value: (logs.today?.value ?? 0) + 1, logId: logs.today?.logId })}>Add</Button></div>
      </div>
    );  
  }
}

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [formItemName, setFormItemName] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<ItemType | undefined>();
  const [selectedDirection, setSelectedDirection] = useState<Directions>('increase');
  const [addItemDialogOpen, setAddItemDialogOpen] = useState<boolean>(false);
  const [addItemError, setAddItemError] = useState<string>('');
  const [addItemLoading, setAddItemLoading] = useState<boolean>(false);
  const [items, setItems] = useState<Items>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const userItemsQuery = api.user.fetchUserData.useQuery({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const createItemsMutation = api.item.createItem.useMutation();
  const createLogMutation = api.log.createItemLog.useMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (createItemsMutation.isSuccess) {
      setAddItemDialogOpen(false);
      setAddItemLoading(false);
      clearFields();
      toast({
        description: 'Item has been created successfully.',
      })
      if (createItemsMutation.data[0]) {
        const newItem = createItemsMutation.data[0];
        const currItems = items.slice();
        currItems.push({ ...newItem, logs: {}, deleted: false });
        setItems(currItems);
      }
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
    } else {
      setLoading(false);
    }
  }, [userItemsQuery.isLoading, userItemsQuery.isSuccess, userItemsQuery.data?.items]);

  useEffect(() => {
    if (createLogMutation.isSuccess && createLogMutation.data) {
      const currItems = items.slice();
      const mutRes = createLogMutation.data[0];
      for (let i = 0; i < currItems.length; i++) {
        const item = { ...currItems[i] } as SingleItem;
        if (item?.itemId === mutRes?.itemId && mutRes) {
          item.logs.today = mutRes;
          currItems[i] = item;
        }
      }
      setItems(currItems);
      setLoading(false);
    } else if (createLogMutation.isError) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem with your request.",
      });
    }
  }, [createLogMutation.isLoading, createLogMutation.isSuccess, createLogMutation.isError]);

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

    createItemsMutation.mutate({
      itemType: selectedItemType,
      itemName: formItemName,
      direction: selectedDirection
    })

    setAddItemLoading(true);
  }

  const handleLog = ({ itemType, itemId, value, logId }: HandleLogBody) => {
    setLoading(true);
    if ((itemType === 'duration' || itemType === 'amount') && !value) {
      toast({
        variant: "destructive",
        title: "Missing Logged Amount",
        description: "There was a problem with your request.",
      })
      return;
    }

    createLogMutation.mutate({
      itemType, itemId, value, logId
    });
  }

  return (
    <>
      <Head>
        <title>Better Than Yesterday</title>
        <meta name="description" content="Better than yesterday." />
        <link rel="icon" href="/icon.ico" />
      </Head>
      <main className="flex min-h-screen items-center justify-center flex-col">
        <div className="absolute right-0 top-0 pt-5 pr-10">
          <UserButton />
        </div>
        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow className="text-xl">
                <TableHead className="w-56">Item</TableHead>
                <TableHead className="w-40">Yesterday</TableHead>
                <TableHead className="w-40">Today</TableHead>
                <TableHead className="text-right w-40">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                items?.filter(item => !item.deleted).map((item) => (
                  <TableRow key={item.itemId} className="h-24 flex-row">
                    <TableCell className="flex flex-row gap-4 h-24 items-center">
                      <Link href={`/item/${item.itemId}`} className="flex-1 align-middle">
                        <div className="hover:underline text-lg">{item.itemName}</div>
                      </Link>
                      <ItemNameIcon itemType={item.itemType} />
                    </TableCell>
                    <TableCell className="">
                      <ItemYtd item={item} />
                    </TableCell>
                    <TableCell>
                      <ItemLogger item={item} handleLog={handleLog} />
                    </TableCell>
                    <TableCell>
                      <ItemDiff item={item} />
                    </TableCell>
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
              <Button variant="outline" className="text-lg">Add Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Add Item</DialogTitle>
                <DialogDescription className="text-lg">
                  Add a new item. Click save.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-lg">
                    Name
                  </Label>
                  <Input id="name" value={formItemName} onChange={(e) => setFormItemName(e.currentTarget.value)} className="col-span-3" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right text-lg">
                    Type
                  </Label>
                  <Select 
                    value={selectedItemType} 
                    onValueChange={(val: ItemType) => setSelectedItemType(val)}
                  >
                    <SelectTrigger className="col-span-3 text-lg">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        itemTypes.map((itemType: ItemType) => (
                          <SelectItem value={itemType} key={itemType} className="capitalize text-lg">
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
                              <Label htmlFor={dir} className="capitalize text-lg">{dir}</Label>
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
                  <Button type="submit" onClick={() => handleAddItem()} className="justify-center text-lg" disabled={addItemLoading}>
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
