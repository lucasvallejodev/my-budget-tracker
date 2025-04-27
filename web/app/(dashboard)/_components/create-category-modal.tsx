"use client"

import { useCallback, useState } from "react";
import { TransactionType } from "./types"
import { createCategorySchema, CreateCategorySchemaType } from "@/schema/categories";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { CircleOffIcon, Loader2, PlusSquareIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Category } from "@prisma/client";
import { createCategory } from "../_actions/categories";

type CreateCategoryModalProps = {
  type: TransactionType;
  onSuccessCallback?: (category: Category) => void;
}

function CreateCategoryModal({ type, onSuccessCallback }: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateCategorySchemaType>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      type,
    },
  });

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createCategory,
    onSuccess: async (data: Category) => {
      toast.success(`Category ${data.name} created successfully`, {
        id: "create-category",
      });
      
      await queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      
      form.reset();
      onSuccessCallback?.(data);
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error creating category", {
        id: "create-category",
      });
    },
  });

  const onSubmit = useCallback((values: CreateCategorySchemaType) => {
    toast.loading("Creating category...", {
      id: "create-category",
    });
    console.log(values)
    mutate(values);
  }, [mutate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex border-separate items-center justify-start rounded-none border-b px-3 py-3 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <PlusSquareIcon className="mr-2 h-4 w-4" />
          Create new
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>
          Create
          <span className={cn(
            "m-1",
            type === "income" ? "text-emerald-500" : "text-orange-500",
          )}>
            {type === "income" ? "income" : "expense"}
          </span> category
        </DialogTitle>
        <DialogDescription>
          Categories are used to group your transactions. You can create a new category for your transactions.
        </DialogDescription>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input defaultValue={""} type="text" placeholder="Category name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the category.
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl className="hidden">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-[100px] w-full"
                        >
                          {
                            form.watch("icon") ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl" role="img">{field.value}</span>
                                <span className="text-xs text-muted-foreground">Click to change</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <CircleOffIcon className="h-[48px] w-[48px]" />
                                <span className="text-xs text-muted-foreground">Click to select</span>
                              </div>
                            )
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full">
                        <EmojiPicker theme={Theme.AUTO} onEmojiClick={(emojiEvent => {
                          field.onChange(emojiEvent.emoji)
                        })} />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                form.reset()
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? <Loader2 className="animate-sping" /> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateCategoryModal