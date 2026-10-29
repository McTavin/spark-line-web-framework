import { useState } from "react";
// Consumer fixture only. Astro owns the surrounding section; React owns this state.
export default function LumosCounter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  return <div><button style={{ minHeight: 44, padding: "0.5rem 1rem" }} onClick={() => setCount(count + 1)}>Increment count</button><output aria-live="polite" data-fixture-count>Count: {count}</output></div>;
}
