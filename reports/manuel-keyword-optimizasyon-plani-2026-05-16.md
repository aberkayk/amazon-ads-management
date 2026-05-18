# PPC Optimizasyon Planı — CSV Bazlı Analiz

**Tarih:** 16 Mayıs 2026  
**Kaynak:** Amazon Seller Central export (CSV)  
**Kapsam:** Manuel Keyword + Auto - Permanent kampanyaları

---

## Finansal Çerçeve

```
Satış fiyatı:             $58.99
Toplam maliyet:           $25.00  (ürün + kargo + Amazon)
─────────────────────────────────
Reklam öncesi kar:        $33.99
Kar marjı:                %57.6

Break-even ACoS:          %57.6   (tüm karı reklamda harcarsanız)
Hedef ACoS (%20 kar):     %37.6   (satış başına ~$11.80 kar)
Hedef ACoS (%25 kar):     %32.6   (satış başına ~$14.75 kar)

Max CPC (hedef %37.6, %10 CVR benchmark): $2.22
Max CPC (gerçek CVR %3.4 ile):            $0.75  ← kritik
Break-even CPC (gerçek CVR %3.4 ile):     $1.16
```

**Manuel Keyword gerçek ACoS:** %131.8 ($155.57 harcama / $117.98 satış) 🔴  
**Auto gerçek ACoS:** %35.2 ($83.00 harcama / $235.96 satış) 🟡 (hedef %37.6'nın altında, karlı)

> Not: MCP API $136.67 harcama gösteriyordu, CSV'de gerçek rakam $155.57. Fark $18.90.

---

## Kritik Bulgu: Tüm Bid'ler Amazon'un Önerdiğinin Çok Altında

CSV'deki suggested bid verileri çok önemli. Bütün kampanyalarda **Top-of-Search impression share <5%** — yani reklamlar neredeyse hiç arama sonuçlarının üstünde çıkmıyor.

### Manuel Keyword — Bid Karşılaştırması

| Keyword | Eşleme | Mevcut Bid | Önerilen (Düşük) | Önerilen (Median) | Önerilen (Yüksek) | ToS Payı |
|---|---|---|---|---|---|---|
| hand massager | BROAD | $1.10 | $3.35 | $4.28 | $4.81 | <5% |
| hand massager | EXACT | $0.80 | $1.94 | $2.58 | $3.23 | 0% |
| hand massager with heat compression | BROAD | $0.80 | $3.35 | $4.28 | $4.83 | <5% |
| hand massager with heat compression | EXACT | $0.60 | $1.84 | $2.45 | $3.06 | 0% |
| hand massager for arthritis and carpal tunnel | BROAD | $0.60 | $1.85 | $2.56 | $3.18 | 0% |
| hand massager for arthritis and carpal tunnel | EXACT | $0.60 | $1.85 | $2.28 | $2.70 | 0% |
| hand massager arthriti carpal tunnel | BROAD | $1.00 | $1.85 | $2.56 | $3.18 | 0% |
| masajeador de manos artritis | EXACT | $0.60 | $2.25 | $3.00 | $3.75 | 0% |

**Sonuç:** $0.60 bid'li keywordler hiç gösterim almıyor çünkü kategori minimumu $1.85+. $1.10 ile bile ancak %5'in altında ToS payı alınıyor.

### Auto Kampanya — Bid Karşılaştırması

| Targeting | Mevcut Bid | Önerilen (Median) | Harcama | ROAS |
|---|---|---|---|---|
| close-match | $0.80 | $2.94 | $10.26 | 0 |
| loose-match | $0.80 | $2.50 | $47.80 | 2.47 |
| substitutes | $0.80 | $1.55 | $24.92 | **4.73** |
| complements | $0.60 | $0.39 | $0 | — |

---

## Performans Özeti

| Kampanya | Harcama | Satış | ROAS | ACoS | Satış Adedi | Durum |
|---|---|---|---|---|---|---|
| Manuel Keyword | $155.57 | $117.98 | 0.76 | %131.8 | 2 | 🔴 |
| Auto - Permanent | $83.00 | $235.96 | 2.84 | %35.2 | 4 | 🟡 |
| **Toplam** | **$238.57** | **$353.94** | **1.48** | **%67.4** | **6** | 🔴 |

---

## Öncelik 1: Acil Bid Düzeltmeleri

### Manuel Keyword — Bid Kuralları (Skill Formülü)

| Keyword | Eşleme | Mevcut Bid | ACoS | Kural | Yeni Bid Önerisi |
|---|---|---|---|---|---|
| hand massager | BROAD | $1.10 | %131.8 | ACoS 100-199% → %20 düşür | $0.88 |
| hand massager with heat compression | BROAD | $0.80 | — (0 satış, $15.18 harcama) | 20+ tıklama, 0 satış → DURAKLAT | PAUSE |

> **Uyarı:** `hand massager` BROAD bid'ini düşürmek gösterimi daha da azaltacak. Eğer hedef ACoS %50+ ise (düşük marj) mevcut bid zaten çok düşük. Maliyet bilinirse bu karar netleşir.

### Auto Kampanya — Bid Ayarları

| Targeting | Mevcut Bid | ROAS | Öneri | Gerekçe |
|---|---|---|---|---|
| substitutes | $0.80 | 4.73 | **$1.20'ye çıkar** | En karlı segment, önerilen $1.55, artış güvenli |
| loose-match | $0.80 | 2.47 | **$1.00'e çıkar** | Pozitif ROAS, dikkatli artış |
| close-match | $0.80 | 0 | **$0.50'ye düşür** | $10.26 harcama, 0 satış |
| complements | $0.60 | — | **Değiştirme** | Önerilen zaten $0.39, 0 impresson |

---

## Öncelik 2: Keyword Funnel Yeniden Yapılandırma

Mevcut yapının sorunu: Auto ve Manuel Keyword aynı aramalarda **birbirleriyle rekabet ediyor**. Negatif keyword izolasyonu yok.

### Yapılması Gereken Funnel Yapısı

```
Auto (keşif)
    ↓ 2+ satış yapan terimler
Manuel Broad (test)
    ↓ 2+ satış yapan terimler  
Manuel Exact (ölçekleme)
```

**Her geçişte kaynak kampanyaya negative eklenecek.**

### Auto'dan Manuel'e Taşınacak Terimler (2+ satış)

Search term raporuna göre Auto kampanyasında iyi performans gösteren terimler Manuel Keyword'e EXACT olarak eklenmeli:

| Arama Terimi | Auto ROAS | Auto ACoS | Önerilen Bid |
|---|---|---|---|
| `arthritis aids for hands` | 31.72 | %3.15 | $1.50 |
| `carpal tunnel heated support wrist` | 31.72 | %3.15 | $1.50 |
| `thumb massager for arthritis and carpal tunnel` | 31.72 | %3.15 | $1.50 |
| `arthritis gloves for women for pain` | 7.93 | %12.61 | $1.20 |
| `hand held massager` | 8.65 | %11.56 | $1.50 |

Bu terimler Auto kampanyasına **negative exact** olarak eklenmeli (çift harcamayı önlemek için).

---

## Öncelik 3: $0.60 Bid'li Keyword'leri Düzelt veya Durdur

Bu 6 keyword 30 günde hiç impresson veya satış almadı. Minimum rekabetçi bid $1.85+.

**Seçenek A — Bid artır:** $0.60 → $1.85-$2.00 (önerilen minimum)  
**Seçenek B — Durdur:** Manuel Keyword bütçesini Auto'ya kaydır

> Maliyet bilgisi olmadan hangi seçeneğin mantıklı olduğunu söylemek güç. Marjın %50+ ise artırmak, %30 altı ise durdurmak önerilir.

---

## Öncelik 4: Bütçe Yeniden Dağılımı

| Kampanya | Mevcut Bütçe | Öneri | Gerekçe |
|---|---|---|---|
| Manuel Keyword | $10/gün | **$5/gün** | ROAS 0.76, zarar ediyor |
| Auto - Permanent | $15/gün | **$20/gün** | ROAS 2.84, karlı |

---

## Haftalık Aksiyon Planı

### Bu Hafta
- [ ] Auto `close-match` bid'ini $0.80 → $0.50'ye düşür
- [ ] Auto `substitutes` bid'ini $0.80 → $1.20'ye çıkar
- [ ] Auto `loose-match` bid'ini $0.80 → $1.00'e çıkar
- [ ] `hand massager with heat compression` BROAD'u duraklat
- [ ] Manuel Keyword günlük bütçeyi $10 → $5'e düşür
- [ ] Auto günlük bütçeyi $15 → $20'ye çıkar

### Gelecek Hafta
- [ ] Auto'dan 5 yüksek performanslı terimi Manuel'e EXACT ekle
- [ ] Bu terimleri Auto'ya negative exact olarak ekle
- [ ] $0.60 bid'li keywordler için karar ver (maliyet bilgisine göre)

### 2-4. Hafta
- [ ] Yeni bid'lerle 14 gün veri topla
- [ ] 20+ tıklama alan keywordleri ACoS formülüyle yeniden değerlendir
- [ ] Break-even ACoS hesapla ve tüm bid hedeflerini güncelle

---

## Temel Sorun: hand massager BROAD Yapısal Olarak Karsız

```
Gerçek CVR:           %3.4  (59 tıklama, 2 satış)
Gerçek CPC:           $2.13
Break-even CPC:       $1.16  (bu fiyatın üzerinde her tıklama zarardır)
Hedef CPC:            $0.75  (%37.6 hedef ACoS'ta başabaş)

Sonuç: $2.13 CPC > $1.16 break-even → her tıklamada zarar
```

Bu keyword'ün kârlı olabilmesi için ya CPC'nin $1.16'nın altına düşmesi, ya da CVR'nin %10'un üzerine çıkması gerekiyor. Her ikisi de mevcut durumda gerçekçi değil.

**Karşılaştırma: Auto substitutes neden kârlı?**
```
Auto CVR (toplam):    %8.2  (49 tıklama, 4 satış)
Auto CPC:             $1.69
Break-even CPC:       $1.16
Hedef CPC:            $2.22  (benchmark CVR'yle)

Sonuç: $1.69 CPC < break-even CPC ile de kârlı çünkü CVR yüksek
```
