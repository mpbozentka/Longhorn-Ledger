'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function LandingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Welcome to The Longhorn Ledger</CardTitle>
          <CardDescription className="text-base">
            Sign in or sign up to track your rounds, view your stats, and see your strokes gained over time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <Button className="w-full" variant="outline" size="lg">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="w-full" size="lg">
              Sign Up
            </Button>
          </SignUpButton>
        </CardContent>
      </Card>
    </div>
  );
}
