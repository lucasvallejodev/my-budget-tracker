import { CurrencyComboBox } from '@/components/currency-combo-box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react'

async function page() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container flex max-w-2xl flex-col items-center justify-between gap-4">
      <div className="text-center">
        <h1 className="text-3xl">Welcome, <span className="ml-2 font-bold">{user.firstName}! 👋</span></h1>
        <h2 className="mt-4 text-base text-muted-foreground">Let&apos;s get started by setting up your current currency</h2>
        <h3 className="mt-2 text-sm text-muted-foreground">You can change these settings later at any time</h3>
      </div>
      <Separator />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Select your currency</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">This will be used for all your transactions</CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <CurrencyComboBox />
        </CardContent>
      </Card>
      <Separator />
      <Button className="w-full" asChild>
        <Link href="/">Go to the dashboard</Link>
      </Button>
    </div>
  )
}

export default page