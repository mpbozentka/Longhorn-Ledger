'use client';

import { useState } from 'react';
import { useRound } from '@/context/round-context';
import { getDemoRoundState } from '@/lib/demo-round';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Gender, TeeBox } from '@/lib/types';
import { TEE_BOX_DATA } from '@/lib/course-data';

type LoginScreenProps = {
  /** When true, show Back button and call onCancel/onStartRound (signed-in start-round flow). */
  showBack?: boolean;
  onCancel?: () => void;
  onStartRound?: () => void;
};

export function LoginScreen({ showBack, onCancel, onStartRound }: LoginScreenProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [teeBox, setTeeBox] = useState<TeeBox>('Longhorn White');
  const { dispatch } = useRound();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      dispatch({ type: 'START_ROUND', payload: { golferName: name.trim(), gender, teeBox } });
      onStartRound?.();
    }
  };

  const handleViewDemo = () => {
    dispatch({ type: 'LOAD_STATE', payload: getDemoRoundState() });
  };

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Start a New Round</CardTitle>
            <CardDescription>Enter your details to begin tracking your strokes gained.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="golfer-name">Golfer Name</Label>
              <Input
                id="golfer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Spieth"
                required
              />
            </div>
            <div className="space-y-3">
              <Label>Gender</Label>
              <RadioGroup
                value={gender}
                onValueChange={(value: Gender) => setGender(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label htmlFor="tee-box">Tee Box</Label>
                <Select
                    value={teeBox}
                    onValueChange={(value: TeeBox) => setTeeBox(value)}
                >
                    <SelectTrigger id="tee-box">
                    <SelectValue placeholder="Select a tee box" />
                    </SelectTrigger>
                    <SelectContent>
                    {TEE_BOX_DATA.map((tee) => (
                        <SelectItem key={tee.name} value={tee.name}>
                        {tee.name} ({tee.rating}/{tee.slope})
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {showBack && (
              <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
                Back
              </Button>
            )}
            <Button type="submit" className="w-full">
              Tee Off
            </Button>
            {!showBack && (
              <Button type="button" variant="ghost" size="sm" onClick={handleViewDemo} className="w-full text-muted-foreground">
                View Demo Results
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
