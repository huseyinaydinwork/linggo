// Ödeme sayfası (hazır altyapı): sipariş özeti + ödeme yöntemi. Sağlayıcı bağlanana kadar WhatsApp ile tamamlanır.
import { post } from '../api.js';
import { APP, isPremium } from '../content.js';
import { M, loadMarket } from '../market.js';
import { pip } from '../mascot.js';
import { artFor, themeSwatch } from '../wear.js';
import { icon, esc, toast } from '../ui.js';
import { navigate } from '../app.js';
import { WA_ICON, openWhatsApp, premiumPlan, tl } from '../premium.js';
import { track } from '../store.js';

export function checkoutView(el, { kind, ref }) {
  track('checkout_view', { kind, ref });
  const pp = premiumPlan();
  let title, amount, sub, art;
  if (kind === 'plan') {
    const yearly = ref === 'premium-yearly';
    amount = yearly ? pp.priceYearly : pp.priceMonthly;
    title = `Premium · ${yearly ? 'Yıllık' : 'Aylık'}`;
    sub = yearly ? `12 ay erişim · ayda ${tl(pp.priceYearly / 12)}` : '1 ay erişim';
    art = pip({ size: 110, mood: 'wow', pose: 'cheer' });
  } else {
    const it = M.items.find(i => i.id === ref);
    if (!it) { loadMarket().then(() => { if (el.isConnected && M.items.some(i => i.id === ref)) checkoutView(el, { kind, ref }); else navigate('/market'); }); el.innerHTML = '<div class="skel"></div>'; return; }
    title = it.name; amount = it.price?.try; sub = 'Pip Market · kalıcı sahiplik';
    art = it.slot === 'theme' ? themeSwatch(it) : it.slot === 'bg' ? `<svg viewBox="0 0 220 220" width="110" height="110">${artFor(it)}</svg>` : pip({ size: 110, outfit: { [it.slot]: it }, mood: 'happy' });
  }
  if (!(amount > 0)) { navigate('/home'); return; }
  const other = kind === 'plan' ? (ref === 'premium-yearly' ? 'premium-monthly' : 'premium-yearly') : null;

  el.innerHTML = `
    <div class="back-row"><button class="icon-btn" data-back aria-label="Geri">${icon.back}</button><p class="eyebrow grow">Güvenli ödeme</p><span class="tag">🔒 SSL</span></div>
    <section class="card co-sum">
      <div class="row gap"><div class="co-art">${art}</div><div class="grow"><p class="eyebrow">Sipariş</p><h1 class="h2" style="margin-top:4px">${esc(title)}</h1><p class="small muted">${esc(sub)}</p></div></div>
      <div class="divider"></div>
      <div class="row between"><span class="muted">Ara toplam</span><span>${tl(amount / 1.2)}</span></div>
      <div class="row between mt-s"><span class="muted">KDV (%20)</span><span>${tl(amount - amount / 1.2)}</span></div>
      <div class="row between mt"><b class="h3">Toplam</b><b class="h2">${tl(amount)}</b></div>
      ${other ? `<a class="link mt-s" href="#/checkout/plan/${other}">${other === 'premium-yearly' ? 'Yıllık plana geç ve tasarruf et' : 'Aylık plana geç'} ${icon.chevron}</a>` : ''}
    </section>
    ${kind === 'plan' ? `<section class="section"><div class="pw-list">${(APP.settings.perks || []).map(p => `<div>${icon.check}<span>${esc(p)}</span></div>`).join('')}</div></section>` : ''}
    <section class="section">
      <p class="eyebrow mb">Ödeme yöntemi</p>
      <div class="pay-methods">
        <label class="pay-m disabled"><input type="radio" name="pm" disabled><span>💳</span><div class="grow"><b>Kredi / banka kartı</b><p class="tiny faint">Online ödeme çok yakında (iyzico / Stripe)</p></div><span class="tag">Yakında</span></label>
        <label class="pay-m on"><input type="radio" name="pm" checked><span style="color:#25D366">${WA_ICON}</span><div class="grow"><b>WhatsApp ile öde</b><p class="tiny faint">Siparişin oluşturulur, ödeme bilgisi WhatsApp'tan iletilir; onayla birlikte hemen aktif edilir.</p></div></label>
      </div>
      <button class="btn btn-wa btn-block mt squish" data-pay>${WA_ICON} Siparişi oluştur · ${tl(amount)}</button>
      <p class="tiny faint center mt-s">Ödemen onaylandığında ${kind === 'plan' ? 'Premium' : 'öğe'} hesabına otomatik tanımlanır ve e-posta ile bilgilendirilirsin.</p>
    </section>`;
  el.querySelector('[data-back]').onclick = () => history.length > 1 ? history.back() : navigate('/home');
  el.querySelector('[data-pay]').onclick = async e => {
    const b = e.currentTarget; b.disabled = true;
    // open the window synchronously to keep the user gesture (popup blockers)
    const w = window.open('about:blank', '_blank');
    try {
      const r = await post('/api/checkout', { kind, ref });
      if (r.provider && r.redirectUrl) { w?.close(); location.href = r.redirectUrl; return; }
      if (w) { w.opener = null; w.location.href = r.whatsappUrl; } else openWhatsApp(r.whatsappUrl);
      el.querySelector('.co-sum').insertAdjacentHTML('afterend', `<div class="form-ok mt">Sipariş #${r.order.id} oluşturuldu. WhatsApp'tan mesajı göndermen yeterli 💬</div>`);
      toast('Siparişin alındı ✅');
    } catch (err) { w?.close(); toast(esc(err.message)); b.disabled = false; }
  };
  void isPremium;
}
