import { getApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, onSnapshot, getDocsFromServer, doc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const db = getFirestore(getApp());
const auth = getAuth();
const source = collection(db, 'cleaningRecords');
const xingfu = collection(db, 'sharedXingfuRecords');
const unpaid = collection(db, 'sharedUnpaidRecords');
let unsubscribe = null;
let queue = Promise.resolve();

const int = value => Number.parseInt(value, 10) || 0;
const str = value => String(value || '');

function xingfuView(record) {
  return {
    customerName: str(record.customerName),
    bookingTime: str(record.bookingTime),
    acCount: int(record.acCount),
    acBrand: str(record.acBrand),
    wmCount: int(record.wmCount),
    wtCount: int(record.wtCount)
  };
}

function unpaidView(record) {
  return {
    customerName: str(record.customerName),
    bookingTime: str(record.bookingTime),
    acCount: int(record.acCount),
    wmCount: int(record.wmCount),
    wtCount: int(record.wtCount),
    totalAmount: int(record.totalAmount)
  };
}

function matches(existing, desired) {
  const keys = Object.keys(desired);
  return Object.keys(existing).length === keys.length && keys.every(key => existing[key] === desired[key]);
}

async function reconcile(target, desired) {
  const current = await getDocsFromServer(target);
  const changes = [];
  current.forEach(snapshot => {
    if (!desired.has(snapshot.id)) changes.push({ type: 'delete', ref: snapshot.ref });
    else if (!matches(snapshot.data(), desired.get(snapshot.id))) changes.push({ type: 'set', ref: snapshot.ref, data: desired.get(snapshot.id) });
    desired.delete(snapshot.id);
  });
  desired.forEach((data, id) => changes.push({ type: 'set', ref: doc(target, id), data }));
  for (let offset = 0; offset < changes.length; offset += 450) {
    const batch = writeBatch(db);
    changes.slice(offset, offset + 450).forEach(change => {
      if (change.type === 'delete') batch.delete(change.ref);
      else batch.set(change.ref, change.data);
    });
    await batch.commit();
  }
}

async function sync(records) {
  const latest = new Map();
  const unpaidRecords = new Map();
  records.forEach(record => {
    if (record.payment === 'unpaid') unpaidRecords.set(record.id, unpaidView(record));
    if (!str(record.customerName).includes('幸福家')) return;
    const branch = str(record.customerName).trim();
    const previous = latest.get(branch);
    if (!previous || str(record.bookingTime) > str(previous.bookingTime)) latest.set(branch, record);
  });
  const latestRecords = new Map([...latest].map(([branch, record]) => [encodeURIComponent(branch), xingfuView(record)]));
  await reconcile(xingfu, latestRecords);
  await reconcile(unpaid, unpaidRecords);
}

onAuthStateChanged(auth, user => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  if (!user) return;
  unsubscribe = onSnapshot(source, { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
    const records = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    queue = queue.then(() => sync(records)).catch(error => console.error('分享清單同步失敗', error));
  }, error => console.error('分享清單讀取失敗', error));
});

