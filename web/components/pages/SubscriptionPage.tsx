"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, PageIntro } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { createSubscriptionCheckout, getPlansWithStats, getSubscription, syncSubscriptionStatus } from "@/lib/actions/subscription";

function PaymentHistoryModal({
  subscription,
  payments,
  onClose,
}: {
  subscription: NonNullable<Awaited<ReturnType<typeof getSubscription>>>["subscription"];
  payments: NonNullable<Awaited<ReturnType<typeof getSubscription>>>["payments"];
  onClose: () => void;
}) {
  const statusLabel = subscription?.status === "active" ? "Aktif" : subscription?.status === "cancelled" ? "Dibatalkan" : "Menunggu pembayaran";
  const periodLabel = subscription?.billingLabel === "yearly" ? "tahun" : "bulan";
  const priceLabel = subscription?.priceLabel === "Custom" ? "Custom" : `${subscription?.priceLabel} / ${periodLabel}`;

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="payment-history-title">
        <div className="modal-header">
          <div>
            <p className="section-kicker">Langganan</p>
            <h2 id="payment-history-title">Riwayat pembayaran</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Tutup dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="payment-history-list">
          {subscription ? (
            <article className="payment-history-item">
              <div className="payment-history-icon"><Icon name="file" /></div>
              <div>
                <strong>Paket {subscription.planLabel}</strong>
                <span>Tagihan bulanan · {priceLabel}</span>
              </div>
              <div className="payment-history-meta">
                <span className={`status-pill ${subscription.status === "active" ? "current-pill" : "upcoming-pill"}`}>{statusLabel}</span>
                <small>
                  {subscription.startsAt ? `Mulai ${subscription.startsAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                  {subscription.endsAt ? ` · berakhir ${subscription.endsAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </small>
              </div>
            </article>
          ) : null}
          {payments.length > 0 ? (
            payments.map((payment) => (
              <article key={payment.id} className="payment-history-item">
                <div className="payment-history-icon"><Icon name="file" /></div>
                <div>
                  <strong>Pembayaran {payment.planLabel}</strong>
                  <span>{payment.amountLabel}{payment.paymentMethod ? ` · ${payment.paymentMethod}` : ""}</span>
                </div>
                <div className="payment-history-meta">
                  <span className={`status-pill ${payment.status === "paid" ? "current-pill" : payment.status === "failed" ? "late-pill" : "upcoming-pill"}`}>
                    {payment.status === "paid" ? "Lunas" : payment.status === "failed" ? "Gagal" : "Menunggu"}
                  </span>
                  <small>
                    {payment.paidAt
                      ? `Dibayar ${payment.paidAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                      : `Dibuat ${payment.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                  </small>
                </div>
              </article>
            ))
          ) : (
            <p className="modal-hint">Belum ada pembayaran tercatat.</p>
          )}
          {subscription?.mayarTransactionId ? (
            <p className="modal-hint">ID transaksi Mayar: {subscription.mayarTransactionId}</p>
          ) : null}
          {subscription?.mayarCheckoutUrl && subscription.status !== "active" ? (
            <a className="primary-button payment-continue-link" href={subscription.mayarCheckoutUrl} target="_blank" rel="noreferrer">
              Lanjutkan pembayaran di Mayar.id <Icon name="arrow" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SubscriptionPage() {
  const { showToast } = useApp();
  const [data, setData] = useState<Awaited<ReturnType<typeof getPlansWithStats>>>();
  const [sub, setSub] = useState<Awaited<ReturnType<typeof getSubscription>>>();
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [plans, subscription] = await Promise.all([getPlansWithStats(), getSubscription()]);
      setData(plans);
      setSub(subscription);
      setLoading(false);
      if (subscription?.subscription?.status === "pending") {
        const synced = await syncSubscriptionStatus();
        if (synced) {
          const [plans2, subscription2] = await Promise.all([getPlansWithStats(), getSubscription()]);
          setData(plans2);
          setSub(subscription2);
        }
      }
    };
    void load();
  }, []);

  const handleChoose = async (name: "Starter" | "Growth" | "Scale", isActive: boolean, isPending?: boolean) => {
    if (isActive) {
      showToast("Paket ini sedang aktif.");
      return;
    }
    // Paket masih menunggu pembayaran: lanjutkan link checkout yang ada.
    if (isPending) {
      const checkoutUrl = sub?.subscription?.mayarCheckoutUrl;
      if (checkoutUrl) {
        showToast("Paket menunggu pembayaran. Melanjutkan ke Mayar.id…");
        window.open(checkoutUrl, "_blank");
      } else {
        showToast("Paket menunggu pembayaran — cek tombol Riwayat pembayaran.");
      }
      return;
    }
    if (name === "Scale") {
      showToast("Untuk paket Scale, hubungi tim kami.");
      return;
    }
    try {
      const res = await createSubscriptionCheckout(name);
      showToast("Mengalihkan ke pembayaran Mayar.id…");
      window.open(res.checkoutUrl, "_blank");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memproses paket.");
    }
  };

  const activePlan = sub?.subscription?.planLabel ?? "Growth";
  const priceLabel = sub?.subscription?.priceLabel ?? "Rp 1.250.000";
  const endsAt = sub?.subscription?.endsAt;
  const studentCount = data?.studentCount ?? 0;
  const teacherCount = data?.teacherCount ?? 0;
  const capacity = data?.plans.find((p) => p.name === activePlan)?.capacity ?? "500";
  const usagePercent = capacity !== "Tak terbatas" ? Math.min(100, Math.round((studentCount / Number(capacity)) * 100)) : 0;

  return (
    <>
      <PageIntro
        kicker="Administrasi"
        title="Kelola Langganan"
        subtitle="Pilih paket sesuai jumlah murid dan pantau status pembayaran sekolah."
        actions={
          <>
            <Link className="secondary-button" href="/pricing"><Icon name="arrow" />Lihat semua paket</Link>
            <button className="secondary-button" type="button" onClick={() => setHistoryOpen(true)}>
              <Icon name="file" />Riwayat pembayaran
            </button>
          </>
        }
      />
      {loading ? (
        <section className="panel"><p>Memuat data langganan…</p></section>
      ) : (
        <>
          <section className="subscription-banner">
            <div>
              <p className="section-kicker">Paket saat ini</p>
              <h2>{activePlan} <span>{sub?.subscription?.status === "active" ? "aktif" : "menunggu pembayaran"}</span></h2>
              <p>
                {endsAt ? `Berakhir pada ${endsAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}. ` : ""}
                Semua fitur utama dapat digunakan.
              </p>
            </div>
            <div className="subscription-price"><small>Rp</small><strong>{priceLabel.replace(/^Rp\s?/, "")}</strong><span>{sub?.subscription?.billingLabel === "yearly" ? "/ tahun" : "/ bulan"}</span></div>
          </section>
          <div className="subscription-layout">
            <section className="panel usage-panel">
              <div className="panel-header">
                <div><p className="section-kicker">Penggunaan bulan ini</p><h2>Kuota sekolah</h2></div>
                <span className={`status-pill ${sub?.subscription?.status === "active" ? "current-pill" : "upcoming-pill"}`}>
                  {sub?.subscription?.status === "active" ? "Pembayaran aktif" : "Menunggu pembayaran"}
                </span>
              </div>
              <div className="usage-stat">
                <div><strong>{studentCount}</strong><span>murid aktif</span></div>
                <div><strong>{teacherCount}</strong><span>guru aktif</span></div>
                <div><strong>{data?.plans.length ?? 3}</strong><span>paket tersedia</span></div>
              </div>
              <div className="usage-bar">
                <div className="usage-bar-label"><span>Kapasitas murid</span><strong>{studentCount} / {capacity}</strong></div>
                <div className="thin-progress"><span style={{ width: `${usagePercent}%` }}></span></div>
              </div>
              <div className="payment-note">
                <span className="mayar-logo">M</span>
                <p>Pembayaran aman diproses melalui <strong>Mayar.id</strong>.</p>
              </div>
            </section>
            <section className="panel plan-panel">
              <p className="section-kicker">Naik atau turunkan paket</p>
              <h2>Paket untuk kebutuhanmu</h2>
              <div className="plan-list">
                {data?.plans.map((plan) => (
                  <article key={plan.name} className={`plan-card${plan.active ? " selected" : ""}`}>
                    <div><strong>{plan.name}</strong><span>{plan.description}</span></div>
                    <b>{plan.price === "Custom" ? "Custom" : `Rp ${plan.price}`}<span>{plan.price === "Custom" ? "" : "/bln"}</span></b>
                    <button className="outline-small" type="button" onClick={() => handleChoose(plan.name as "Starter" | "Growth" | "Scale", plan.active, plan.pending)}>
                      {plan.active ? "Aktif" : plan.pending ? "Menunggu" : "Pilih"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      {historyOpen && sub ? (
        <PaymentHistoryModal
          subscription={sub.subscription}
          payments={sub.payments}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
    </>
  );
}
