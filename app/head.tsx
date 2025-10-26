// app/head.tsx
export default function Head() {
  return (
    <>
      {/* Origin Trial meta tag for local testing */}
      <meta
        httpEquiv="origin-trial"
        content={process.env.NEXT_PUBLIC_ORIGIN_TRIAL_TOKEN ?? ""}
      />
    </>
  )
}
