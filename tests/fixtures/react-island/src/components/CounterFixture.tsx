import { useState } from "react";
import { Action, CardShell, Stack, Text } from "@spark-line/web-framework/react";

// Fixture-only interaction: verifies consumers can hydrate the retained primitives.
export default function CounterFixture({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  return (
    <CardShell data-fixture-counter>
      <Stack gap="sm">
        <Text>Only this component owns client state.</Text>
        <output aria-live="polite" data-fixture-count>Count: {count}</output>
        <Action onClick={() => setCount((value) => value + 1)}>Increment count</Action>
      </Stack>
    </CardShell>
  );
}
