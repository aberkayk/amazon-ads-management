# Amazon Ads Dashboard

<div align="center">

[🇬🇧 English](#english) · [🇹🇷 Türkçe](#türkçe)

</div>

---

## English

A Next.js 16 dashboard for monitoring Amazon Sponsored Products performance. Displays campaign, keyword, search term, and product metrics with 1-hour file-based caching.

### Prerequisites

- Node.js 18+
- An Amazon Ads developer application ([create one here](https://advertising.amazon.com/API/docs/en-us/setting-up/overview))
- Your `AMAZON_PROFILE_ID` (visible in the Amazon Ads console URL)

### Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_CLIENT_SECRET=amzn1.oa2-cs.v1.xxx
AMAZON_REFRESH_TOKEN=Atzr|xxx
AMAZON_PROFILE_ID=1234567890
```

**3. Get a Refresh Token** *(repeat when token expires)*

Open the authorization URL in your browser (replace `YOUR_CLIENT_ID`):

```
https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090
```

After signing in, copy the `code=` value from the redirect URL (expires in 5 min), then exchange it:

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=https://localhost:9090" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

Copy the `refresh_token` from the response into `.env.local`.

**4. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If credentials are missing, the app redirects to the in-app setup guide automatically.

### Features

- **Overview** — spend, ROAS, orders, clicks KPIs + top campaigns bar chart
- **Campaigns / Keywords / Search Terms / Products** — sortable, filterable data tables
- **1-hour cache** — reports are cached to disk; click Refresh to fetch new data
- **Dark / light mode** — theme switcher in the header
- **Collapsible sidebar** — toggle with the `⊟` button or `Ctrl+B`

---

## Türkçe

Amazon Sponsored Products performansını izlemek için Next.js 16 tabanlı bir dashboard. Kampanya, keyword, arama terimi ve ürün metriklerini 1 saatlik dosya tabanlı önbellekleme ile gösterir.

### Gereksinimler

- Node.js 18+
- Bir Amazon Ads geliştirici uygulaması ([buradan oluşturun](https://advertising.amazon.com/API/docs/en-us/setting-up/overview))
- `AMAZON_PROFILE_ID` (Amazon Ads konsol URL'inde görünür)

### Kurulum

**1. Bağımlılıkları yükle**

```bash
npm install
```

**2. Ortam değişkenlerini ayarla**

`.env.example` dosyasını `.env.local` olarak kopyalayın ve doldurun:

```env
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxx
AMAZON_CLIENT_SECRET=amzn1.oa2-cs.v1.xxx
AMAZON_REFRESH_TOKEN=Atzr|xxx
AMAZON_PROFILE_ID=1234567890
```

**3. Refresh Token Al** *(token süresi dolduğunda tekrarlayın)*

Aşağıdaki URL'i tarayıcıda açın (`YOUR_CLIENT_ID` yerine kendi ID'nizi yazın):

```
https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=https://localhost:9090
```

Giriş sonrası yönlendirme URL'indeki `code=` değerini kopyalayın (5 dakika geçerli), ardından token alın:

```bash
curl -X POST https://api.amazon.com/auth/o2/token \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  -d "grant_type=authorization_code" \
  -d "code=ALDIGINIZ_KOD" \
  -d "redirect_uri=https://localhost:9090" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET"
```

Gelen yanıttaki `refresh_token` değerini `.env.local` dosyasına yapıştırın.

**4. Geliştirme sunucusunu başlat**

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini açın. Kimlik bilgileri eksikse uygulama otomatik olarak kurulum kılavuzuna yönlendirir.

### Özellikler

- **Overview** — harcama, ROAS, sipariş, tıklama KPI'ları + en iyi kampanya çubuğu grafiği
- **Campaigns / Keywords / Search Terms / Products** — sıralanabilir, filtrelenebilir tablolar
- **1 saatlik önbellek** — raporlar diske kaydedilir; yeni veri için Refresh butonuna basın
- **Koyu / açık mod** — header'daki tema değiştirici
- **Daraltılabilir sidebar** — `⊟` butonu veya `Ctrl+B` ile aç/kapat
