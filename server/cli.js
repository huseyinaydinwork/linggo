// Komut satırı araçları
//   npm run make-admin -- eposta@ornek.com
//   npm run grant -- eposta@ornek.com 30      (30 günlük premium; gün yazılmazsa süresiz)
import { q } from './db.js';

const [cmd, email, arg] = process.argv.slice(2);
const user = email && q.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
if (!user) { console.error(`\n  ✖ Kullanıcı bulunamadı: ${email || '(e-posta yazılmadı)'}\n  Önce uygulamadan bu e-postayla kayıt ol.\n`); process.exit(1); }

if (cmd === 'make-admin') {
  q.run("UPDATE users SET role = 'admin', verified = 1 WHERE id = ?", user.id);
  console.log(`\n  ✔ ${user.email} artık yönetici. Panel: /admin\n`);
} else if (cmd === 'grant') {
  const until = arg ? Date.now() + Number(arg) * 864e5 : null;
  q.run("UPDATE users SET plan = 'premium', plan_until = ? WHERE id = ?", until, user.id);
  console.log(`\n  ✔ ${user.email} Premium${until ? ' → ' + new Date(until).toLocaleDateString('tr-TR') : ' (süresiz)'}\n`);
} else {
  console.error('Komutlar: make-admin <eposta> | grant <eposta> [gün]');
  process.exit(1);
}
