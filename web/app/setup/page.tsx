import { CopyButton } from '@/components/copy-button';

const clientId = process.env.AMAZON_CLIENT_ID ?? 'YOUR_CLIENT_ID';

const oauthUrl =
  `https://www.amazon.com/ap/oa?client_id=${clientId}` +
  `&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090`;

const curlTemplate = `curl -X POST https://api.amazon.com/auth/o2/token \\
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \\
  -d "grant_type=authorization_code" \\
  -d "code=YOUR_CODE" \\
  -d "redirect_uri=https://localhost:9090" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`;

export default function SetupPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Amazon Ads API Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the steps below to connect your Amazon Ads account.
        </p>
      </div>

      {/* Step 1 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            1
          </span>
          <h2 className="font-medium">Open the Authorization URL</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Copy the URL below, open it in your browser, and sign in with your Amazon account.
        </p>
        <div className="flex items-start gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
            {oauthUrl}
          </code>
          <CopyButton text={oauthUrl} />
        </div>
      </div>

      {/* Step 2 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            2
          </span>
          <h2 className="font-medium">Grab the Code</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          After signing in, the browser redirects to{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            https://localhost:9090/?code=XXXX
          </code>{' '}
          — the page won&apos;t load, that&apos;s expected.
        </p>
        <p className="text-sm text-muted-foreground">
          Copy the value after{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">code=</code>{' '}
          from the URL.{' '}
          <span className="font-medium text-foreground">It expires in 5 minutes.</span>
        </p>
      </div>

      {/* Step 3 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            3
          </span>
          <h2 className="font-medium">Exchange the Code for a Token</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste the code to{' '}
          <span className="font-medium text-foreground">Claude</span>{' '}
          — it will run the request and retrieve the refresh token automatically.
        </p>
        <p className="text-sm text-muted-foreground">
          Or run it yourself (replace the placeholders):
        </p>
        <div className="flex items-start gap-2">
          <pre className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre">
            {curlTemplate}
          </pre>
          <CopyButton text={curlTemplate} />
        </div>
      </div>

      {/* Step 4 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            4
          </span>
          <h2 className="font-medium">Update .env</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Copy the{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">refresh_token</code>
          {' '}from the response into your{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">.env</code>
          {' '}file, then restart the dev server.
        </p>
        <pre className="rounded bg-muted px-3 py-2 text-xs font-mono">{`AMAZON_CLIENT_ID=...
AMAZON_CLIENT_SECRET=...
AMAZON_REFRESH_TOKEN=<paste here>
AMAZON_PROFILE_ID=...`}</pre>
      </div>
    </div>
  );
}
