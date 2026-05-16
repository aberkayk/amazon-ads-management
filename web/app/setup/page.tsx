import { CopyButton } from '@/components/copy-button';

const clientId = process.env.AMAZON_CLIENT_ID ?? 'YOUR_CLIENT_ID';

const oauthUrl =
  `https://www.amazon.com/ap/oa?client_id=${clientId}` +
  `&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090`;

const curlTemplate = `curl -X POST https://api.amazon.com/auth/o2/token \\
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \\
  -d "grant_type=authorization_code" \\
  -d "code=ALDIGINIZ_KOD" \\
  -d "redirect_uri=https://localhost:9090" \\
  -d "client_id=CLIENT_ID" \\
  -d "client_secret=CLIENT_SECRET"`;

export default function SetupPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Amazon Ads API Kurulumu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aşağıdaki adımları sırayla tamamlayarak bağlantıyı yapılandırın.
        </p>
      </div>

      {/* Adım 1 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            1
          </span>
          <h2 className="font-medium">Yetkilendirme URL&apos;ini Açın</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Aşağıdaki URL&apos;i kopyalayıp tarayıcıda açın ve Amazon hesabınızla giriş yapın.
        </p>
        <div className="flex items-start gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
            {oauthUrl}
          </code>
          <CopyButton text={oauthUrl} />
        </div>
      </div>

      {/* Adım 2 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            2
          </span>
          <h2 className="font-medium">Kodu Alın</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Giriş sonrası tarayıcı{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            https://localhost:9090/?code=XXXX
          </code>{' '}
          adresine yönlendirir — sayfa açılmaz, bu normaldir.
        </p>
        <p className="text-sm text-muted-foreground">
          URL&apos;deki{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">code=</code>
          {' '}değerini kopyalayın.{' '}
          <span className="font-medium text-foreground">5 dakika geçerlidir.</span>
        </p>
      </div>

      {/* Adım 3 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            3
          </span>
          <h2 className="font-medium">Token Alın (Claude ile)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Aldığınız kodu{' '}
          <span className="font-medium text-foreground">bana (Claude&apos;a) yazın</span>{' '}
          — curl isteğini ben atacağım ve refresh token&apos;ı otomatik alacağım.
        </p>
        <p className="text-sm text-muted-foreground">
          İsterseniz aşağıdaki komutu kendiniz de çalıştırabilirsiniz (placeholders&apos;ları doldurun):
        </p>
        <div className="flex items-start gap-2">
          <pre className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre">
            {curlTemplate}
          </pre>
          <CopyButton text={curlTemplate} />
        </div>
      </div>

      {/* Adım 4 */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            4
          </span>
          <h2 className="font-medium">.env Güncelleme</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Dönen{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">refresh_token</code>
          {' '}değerini{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">.env</code>
          {' '}dosyasındaki{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">AMAZON_REFRESH_TOKEN</code>
          {' '}alanına yazın, ardından uygulamayı yeniden başlatın.
        </p>
        <pre className="rounded bg-muted px-3 py-2 text-xs font-mono">{`AMAZON_CLIENT_ID=...
AMAZON_CLIENT_SECRET=...
AMAZON_REFRESH_TOKEN=<buraya_yapistirin>
AMAZON_PROFILE_ID=...`}</pre>
      </div>
    </div>
  );
}
