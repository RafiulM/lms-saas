"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon, PageIntro } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { plans as mockPlans } from "@/lib/data";
import {
  createSubscriptionCheckout,
  getPlansWithStats,
  getSubscription,
  syncSubscriptionStatus,
} from "@/lib/actions/subscription";

type LivePlan = {
  name: string;
  description: string;
  capacity: string;
  price: string;
  priceNumber: number | null;
  active: boolean;
  pending: boolean;
};

const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID").format(value);

const TEST_COUPON_CODE = "KELASHUB100";

export function PricingPage() {
  const { user, showToast } = useApp();
  const searchParams = useSearchParams();
  const gated = searchParams.get("paywall") === "1";
  const [billing, setBilling] = useState<"Bulanan" | "Tahunan">("Bulanan");
  const [live, setLive] = useState<Awaited<ReturnType<typeof getPlansWithStats>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [plans, subscription] = await Promise.all([getPlansWithStats(), getSubscription()]);
        if (plans) {
          setLive(plans);
        } else if (!user) {
          setLive(null);
        } else {
          setError("Data paket belum tersedia. Pastikan akun admin terhubung ke sekolah, lalu muat ulang halaman.");
        }
        if (subscription?.subscription?.status === "pending") {
          const synced = await syncSubscriptionStatus();
          if (synced) {
            const refreshed = await getPlansWithStats();
            if (refreshed) setLive(refreshed);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data paket.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const plans: LivePlan[] = live
    ? live.plans.map((p) => ({
        name: p.name,
        description: p.description,
        capacity: p.capacity,
        price: p.price,
        priceNumber: p.priceNumber,
        active: p.active,
        pending: p.pending,
      }))
    : mockPlans.map((p) => ({
        name: p.name,
        description: p.description,
        capacity: p.capacity,
        price: p.price,
        priceNumber: null,
        active: p.name === "Growth",
        pending: false,
      }));

  const handleChoose = async (plan: LivePlan) => {
    if (plan.active) {
      showToast(`Paket ${plan.name} sedang aktif.`);
      return;
    }
    // Paket masih menunggu pembayaran: buka kembali link checkout yang ada.
    if (plan.pending) {
      const checkoutUrl = live?.subscription?.mayarCheckoutUrl;
      if (checkoutUrl) {
        showToast(`Paket ${plan.name} menunggu pembayaran. Melanjutkan ke Mayar.id…`);
        window.open(checkoutUrl, "_blank");
      } else {
        showToast(`Paket ${plan.name} menunggu pembayaran — cek Riwayat pembayaran di halaman langganan.`);
      }
      return;
    }
    if (plan.name === "Scale") {
      showToast("Untuk paket Scale, hubungi tim kami.");
      return;
    }
    if (loading) {
      showToast("Data paket sedang dimuat, coba lagi sebentar.");
      return;
    }
    if (!user) {
      showToast("Masuk sebagai admin sekolah untuk memilih paket.");
      return;
    }
    if (user.role !== "admin") {
      showToast("Hanya admin sekolah yang dapat memilih paket.");
      return;
    }
    if (!live) {
      showToast("Data paket belum tersedia, muat ulang halaman.");
      return;
    }
    if (plan.priceNumber === null) return;
    try {
      const period = billing === "Tahunan" ? "yearly" : "monthly";
      const res = await createSubscriptionCheckout(
        plan.name as "Starter" | "Growth",
        period,
        appliedCode ?? undefined,
      );
      if (res.couponCode) {
        showToast(`Kupon ${res.couponCode} diterapkan (diskon ${res.discountPercent}%). Mengalihkan ke pembayaran…`);
      } else {
        showToast("Mengalihkan ke pembayaran Mayar.id…");
      }
      window.open(res.checkoutUrl, "_blank");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memproses paket.");
    }
  };

  const handleApplyCode = () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) {
      showToast("Masukkan kode diskon terlebih dahulu.");
      return;
    }
    if (code !== TEST_COUPON_CODE) {
      showToast("Kode diskon tidak valid.");
      return;
    }
    setAppliedCode(code);
    showToast(`Kupon ${code} siap digunakan (diskon 99%).`);
  };

  return (
    <>
      <PageIntro
        kicker="Paket KelasHub"
        title="Pricing yang tumbuh bersama sekolah."
        subtitle="Pilih paket berdasarkan jumlah murid. Naikkan kapasitas kapan saja tanpa memindahkan data."
        actions={
          <Link className="secondary-button" href="/langganan"><Icon name="file" />Lihat langganan aktif</Link>
        }
      />
      {gated ? (
        <section className="panel pricing-note">
          <div className="pricing-note-icon"><Icon name="file" /></div>
          <div>
            <p className="section-kicker">Akses dibatasi</p>
            <h2>Sekolah kamu belum berlangganan.</h2>
            <p>Pilih paket di bawah ini untuk mengaktifkan seluruh fitur KelasHub. Pembayaran diproses otomatis melalui Mayar.id dan akun aktif segera setelah pembayaran dikonfirmasi.</p>
          </div>
        </section>
      ) : null}
      <div className="billing-toggle">
        <button type="button" className={billing === "Bulanan" ? "active" : ""} onClick={() => setBilling("Bulanan")}>Bayar bulanan</button>
        <button type="button" className={billing === "Tahunan" ? "active" : ""} onClick={() => setBilling("Tahunan")}>Bayar tahunan <span>Hemat 20%</span></button>
      </div>
      <div className="discount-row">
        <div className="form-field discount-field">
          <input
            type="text"
            value={discountInput}
            onChange={(event) => setDiscountInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") handleApplyCode(); }}
            placeholder="Masukkan kode diskon"
            aria-label="Kode diskon"
          />
        </div>
        <button className="secondary-button" type="button" onClick={handleApplyCode}>Terapkan</button>
        {appliedCode ? (
          <span className="discount-applied">Kupon {appliedCode} aktif — diskon diterapkan otomatis, tidak perlu dimasukkan lagi di halaman Mayar</span>
        ) : null}
      </div>
      {error && !live ? (
        <section className="panel pricing-note">
          <div className="pricing-note-icon"><Icon name="file" /></div>
          <div>
            <p className="section-kicker">Info</p>
            <h2>Data paket belum tersedia.</h2>
            <p>{error}</p>
          </div>
          <Link className="text-button" href="/langganan">Buka halaman langganan <Icon name="arrow" /></Link>
        </section>
      ) : null}
      {!loading && !user ? (
        <p className="modal-hint">
          Menampilkan contoh harga. <Link href="/masuk">Masuk sebagai admin sekolah</Link> untuk memilih paket dan membayar.
        </p>
      ) : null}
      <section className="pricing-grid">
        {plans.map((plan) => {
          const isYearly = billing === "Tahunan";
          const displayPrice = plan.priceNumber != null && isYearly ? formatRupiah(Math.round(plan.priceNumber * 12 * 0.8)) : plan.price;
          return (
            <article key={plan.name} className={`price-card${plan.active ? " featured-plan" : ""}`}>
              {plan.active ? <span className="popular-label">Paket saat ini</span> : plan.pending ? <span className="popular-label pending-label">Menunggu pembayaran</span> : null}
              <p className="section-kicker">Paket {plan.name}</p>
              <h2>{plan.name}</h2>
              <p className="price-description">{plan.description}</p>
              <div className="price-value">
                {plan.price === "Custom" ? (
                  "Custom"
                ) : (
                  <>
                    <small>Rp</small>
                    {displayPrice}
                    <span>{isYearly ? "/ tahun" : "/ bulan"}</span>
                  </>
                )}
              </div>
              <div className="price-capacity">
                <span className="price-check"><Icon name="check" /></span>
                <div><strong>Hingga {plan.capacity} murid</strong><small>Guru dan admin tidak dibatasi</small></div>
              </div>
              <ul className="price-features">
                <li><Icon name="check" />Beranda aktivitas terpusat</li>
                <li><Icon name="check" />Jadwal dan tugas digital</li>
                <li><Icon name="check" />Input serta rekap nilai</li>
                <li><Icon name="check" />Impor data dari Excel</li>
                <li><Icon name="check" />Dukungan KelasHub</li>
              </ul>
              <button
                type="button"
                className={plan.active ? "secondary-button" : "primary-button"}
                onClick={() => void handleChoose(plan)}
              >
                {plan.active ? "Paket saat ini" : plan.pending ? "Lanjutkan pembayaran" : `Pilih ${plan.name}`} <Icon name={plan.active ? "check" : "arrow"} />
              </button>
            </article>
          );
        })}
      </section>
      <section className="panel pricing-note">
        <div className="pricing-note-icon"><Icon name="grid" /></div>
        <div>
          <p className="section-kicker">Tanpa biaya tersembunyi</p>
          <h2>Semua data sekolah tetap milik sekolah.</h2>
          <p>{live ? `Billing dihitung dari ${live.studentCount} murid dan ${live.teacherCount} guru aktif. Pembayaran diproses otomatis melalui Mayar.id dan kamu bisa mengubah paket atau membatalkan kapan saja melalui dashboard.` : "Billing dihitung berdasarkan murid aktif. Kamu bisa mengubah paket atau membatalkan kapan saja melalui dashboard."}</p>
        </div>
        <button className="text-button" type="button" onClick={() => showToast("Tim KelasHub siap membantu memilih paket.")}>
          Tanya tim kami <Icon name="arrow" />
        </button>
      </section>
    </>
  );
}
