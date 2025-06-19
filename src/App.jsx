import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const firebaseConfig = {
  apiKey: "AIzaSyB1kZl3nvohEa35-lv6LPIm2brWRxTn4f0",
  authDomain: "infomation-assistant33.firebaseapp.com",
  projectId: "infomation-assistant33",
  storageBucket: "infomation-assistant33.firebasestorage.app",
  messagingSenderId: "993568139699",
  appId: "1:993568139699:web:23dfba10652490661f03c6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [inputType, setInputType] = useState('text');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(''); // 保存時に指定する日付
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [newCategoryName, setNewCategoryName] = useState(''); // 新しいカテゴリ名用

  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('category');

  useEffect(() => {
    fetchCategories();
    fetchData();
  }, []);

  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    const items = snapshot.docs.map(doc => doc.data().name);
    setCategories(items);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください');
      return;
    }
    try {
      await addDoc(collection(db, 'categories'), { name: newCategoryName.trim() });
      setNewCategoryName('');
      fetchCategories();
      alert('カテゴリを追加しました！');
    } catch (error) {
      console.error("Error adding category: ", error);
      alert('カテゴリの追加に失敗しました。');
    }
  };

  const fetchData = async () => {
    const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setResults(items);
  };

  const getThumbnail = (content) => {
    try {
      const url = new URL(content);
      return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
    } catch {
      return '/default-thumb.png';
    }
  };

  // 保存日時（createdAt）表示用
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 指定日時（date）表示用
  const formatDateOnly = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const saveData = async () => {
    if (!content || !category) return alert('内容とカテゴリを入力してください');
    const payload = {
      content,
      type: inputType,
      category,
      date: date ? Timestamp.fromDate(new Date(date)) : null, // カレンダーで選択した日付を保存
      createdAt: Timestamp.now(), // データが保存された日時
      favorite: false
    };
    if (editingId) {
      await updateDoc(doc(db, 'links', editingId), payload);
    } else {
      await addDoc(collection(db, 'links'), payload);
    }
    setContent('');
    setCategory('');
    setDate('');
    setEditingId(null);
    setIsModalOpen(false);
    fetchData();
  };

  const toggleFavorite = async (id, current) => {
    await updateDoc(doc(db, 'links', id), { favorite: !current });
    fetchData();
  };

  const deleteItem = async (id) => {
    if (confirm('本当に削除しますか？')) {
      await deleteDoc(doc(db, 'links', id));
      fetchData();
    }
  };

  // 編集開始時にフォームにデータをロードする関数
  const startEdit = (item) => {
    setInputType(item.type);
    setContent(item.content);
    setCategory(item.category);
    // item.dateがTimestampならtoDate()してISO形式にする
    setDate(item.date ? item.date.toDate().toISOString().slice(0, 10) : '');
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const groupedByCategory = categories.map(cat => ({
    name: cat,
    items: results.filter(r => r.category === cat)
  }));

  const filteredByDate = results.filter(item => {
    if (!item.date) return false;
    const d = item.date.toDate();
    return d.toDateString() === calendarDate.toDateString();
  });

  return (
    <div className="max-w-2xl mx-auto p-4 text-base md:text-lg">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="検索"
          className="flex-1 border p-3 rounded"
        />
        <button onClick={() => { setIsModalOpen(true); setEditingId(null); }} className="text-3xl bg-blue-500 text-white px-4 py-2 rounded">＋</button>
      </div>

      <div className="flex gap-2 border-b mb-4 text-lg">
        <button className={activeTab === 'category' ? 'border-b-2 border-black px-4 py-2' : 'px-4 py-2'} onClick={() => setActiveTab('category')}>カテゴリ</button>
        <button className={activeTab === 'source' ? 'border-b-2 border-black px-4 py-2' : 'px-4 py-2'} onClick={() => setActiveTab('source')}>保存元</button>
        <button className={activeTab === 'calendar' ? 'border-b-2 border-black px-4 py-2' : 'px-4 py-2'} onClick={() => setActiveTab('calendar')}>カレンダー</button>
      </div>

      {activeTab === 'calendar' && (
        <div>
          <Calendar value={calendarDate} onChange={setCalendarDate} className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredByDate.map(item => (
              <div key={item.id} className="border p-4 rounded">
                <img src={getThumbnail(item.content)} className="w-full h-32 object-contain" alt="Thumbnail" />
                <div className="font-semibold">{item.category}（{item.type}）</div>
                <div className="truncate text-sm">
            {item.type === 'url' ? (
              <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {item.content}
              </a>
            ) : (
              item.content
            )}
          </div>
                {item.date && <div className="text-xs text-gray-700 mt-1">日時: {formatDateOnly(item.date)}</div>}
                {item.createdAt && <div className="text-xs text-gray-500 mt-1">保存日時: {formatTimestamp(item.createdAt)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'category' && groupedByCategory.map(group => (
        <div key={group.name} className="mb-6">
          <h3 className="font-bold text-lg mb-2">{group.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.items.map(item => (
              <div key={item.id} className="border p-4 rounded">
                <img src={getThumbnail(item.content)} className="w-full h-32 object-contain" alt="Thumbnail" />
                <div className="font-semibold">{item.type}</div>
                 <div className="truncate text-sm">
            {item.type === 'url' ? (
              <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {item.content}
              </a>
            ) : (
              item.content
            )}
          </div>
                {item.date && <div className="text-xs text-gray-700 mt-1">日時: {formatDateOnly(item.date)}</div>}
                {item.createdAt && <div className="text-xs text-gray-500 mt-1">保存日時: {formatTimestamp(item.createdAt)}</div>}
                <div className="mt-2 flex justify-between">
                  <button onClick={() => startEdit(item)} className="text-blue-600">編集</button>
                  <button onClick={() => deleteItem(item.id)} className="text-red-500">削除</button>
                  <button onClick={() => toggleFavorite(item.id, item.favorite)}>{item.favorite ? '★' : '☆'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {isModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 space-y-4 z-50">
          <h2 className="text-xl font-bold">{editingId ? '編集' : '新規登録'}</h2>
          <select value={inputType} onChange={e => setInputType(e.target.value)} className="w-full border rounded p-3">
            <option value="text">テキスト</option>
            <option value="url">URL</option>
            <option value="x">Xの投稿</option>
            <option value="instagram">Instagram投稿</option>
            <option value="map">Googleマップのお店</option>
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="内容" className="w-full border rounded p-3" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded p-3">
            <option value="">カテゴリを選択</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-3" />

          {/* 新しいカテゴリ追加セクション */}
          <h3 className="text-lg font-semibold mt-4">カテゴリ管理</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="新しいカテゴリ名"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="flex-1 border rounded p-3"
            />
            <button onClick={addCategory} className="bg-green-500 text-white py-3 px-4 rounded">追加</button>
          </div>

          <div className="flex gap-2">
            <button onClick={saveData} className="flex-1 bg-blue-600 text-white py-3 rounded">保存</button>
            <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-400 text-white py-3 rounded">キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}
