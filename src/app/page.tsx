import { MainApp } from '@/components/main-app';
import { RoundProvider } from '@/context/round-context';

export default function Home() {
  return (
    <RoundProvider>
      <MainApp />
    </RoundProvider>
  );
}
