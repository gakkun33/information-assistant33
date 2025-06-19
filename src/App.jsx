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
  const [isModalOpen, setIsModalOpen] = useState(false); // 新規/編集モーダルの開閉
  const [activeTab, setActiveTab] = useState('category'); // 初期表示はカテゴリタブに設定

  const [selectedCategory, setSelectedCategory] = useState(null); // 選択されたカテゴリ名 (アイテム表示用)
  const [selectedSource, setSelectedSource] = useState(null);     // 選択された保存元タイプ (アイテム表示用)


  // 保存元タイプの定義 (inputTypeのselectオプションと一致させる)
  const sourceTypes = [
    { value: 'text', label: 'テキスト' },
    { value: 'url', label: 'URL' },
    { value: 'x', label: 'Xの投稿' },
    { value: 'instagram', label: 'Instagram投稿' },
    { value: 'map', label: 'Googleマップのお店' },
  ];

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
      return '/default-thumb.png'; // URLでない場合やエラーの場合のデフォルト画像
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
    setIsModalOpen(false); // 保存後、新規/編集モーダルを閉じる
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
    setIsModalOpen(true); // 新規/編集モーダルを開く
    // アイテム一覧モーダルが開いている場合は閉じる
    setSelectedCategory(null);
    setSelectedSource(null);
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
    <div className="min-h-screen bg-gray-50 text-base"> {/* 全体サイズ調整と背景色 */}
      {/* ヘッダー部分 */}
      <header className="flex items-center p-4 bg-white shadow-md">
        <div className="flex-grow mr-3">
          <input
            type="text"
            placeholder="検索"
            className="w-full border p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            // 検索機能は未実装なので、必要であればここに追加してください
          />
        </div>
        <button
          onClick={() => { setIsModalOpen(true); setEditingId(null); }}
          className="flex-shrink-0 text-3xl bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        >
          ＋
        </button>
      </header>

      {/* タブバー部分 */}
      <nav className="flex justify-around border-b border-gray-200 bg-white shadow-sm">
        <button
          className={`flex-1 py-3 text-center transition-colors duration-200 ${activeTab === 'source' ? 'border-b-4 border-blue-500 text-blue-500 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('source')}
        >
          保存元
        </button>
        <button
          className={`flex-1 py-3 text-center transition-colors duration-200 ${activeTab === 'category' ? 'border-b-4 border-blue-500 text-blue-500 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('category')}
        >
          カテゴリ
        </button>
        <button
          className={`flex-1 py-3 text-center transition-colors duration-200 ${activeTab === 'calendar' ? 'border-b-4 border-blue-500 text-blue-500 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('calendar')}
        >
          カレンダー
        </button>
      </nav>

      {/* メインコンテンツエリア */}
      <main className="p-4">
        {activeTab === 'calendar' && (
          <div>
            <Calendar value={calendarDate} onChange={setCalendarDate} className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredByDate.map(item => (
                <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-white">
                  <img src={getThumbnail(item.content)} className="w-full h-32 object-contain mb-2 rounded" alt="Thumbnail" />
                  <div className="font-semibold text-gray-800">{item.category}（{item.type}）</div>
                  <div className="truncate text-sm text-gray-700 mb-1">
                    {item.type === 'url' ? (
                      <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {item.content}
                      </a>
                    ) : (
                      item.content
                    )}
                  </div>
                  {item.date && <div className="text-xs text-gray-600 mt-1">日時: {formatDateOnly(item.date)}</div>}
                  {item.createdAt && <div className="text-xs text-gray-500">保存日時: {formatTimestamp(item.createdAt)}</div>}
                  <div className="mt-3 flex justify-between items-center">
                    <button onClick={() => startEdit(item)} className="text-blue-600 text-sm hover:underline">編集</button>
                    <button onClick={() => deleteItem(item.id)} className="text-red-500 text-sm hover:underline">削除</button>
                    <button onClick={() => toggleFavorite(item.id, item.favorite)} className="text-xl">{item.favorite ? '★' : '☆'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* カテゴリ表示タブ - フォルダ形式 */}
        {activeTab === 'category' && (
          <div className="grid grid-cols-3 gap-2 p-1"> {/* 横3列、gap-2, p-1 に変更 */}
            {categories.map(catName => (
              <div
                key={catName}
                className="border p-1 rounded-lg shadow-sm bg-white flex flex-col items-center justify-center h-20 cursor-pointer hover:bg-gray-50 transition-colors duration-200" // h-20, p-1 に変更
                onClick={() => setSelectedCategory(catName)}
              >
                {/* フォルダアイコン */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* h-8 w-8 に変更 */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="font-bold text-xs text-gray-800 text-center truncate w-full px-1">{catName}</h3> {/* text-xs, truncate, px-1 に変更 */}
                <span className="text-[0.6rem] text-gray-500">{results.filter(r => r.category === catName).length}件</span> {/* text-[0.6rem] に変更 */}
              </div>
            ))}
          </div>
        )}

        {/* 保存元表示タブ - フォルダ形式 */}
        {activeTab === 'source' && (
          <div className="grid grid-cols-3 gap-2 p-1"> {/* 横3列、gap-2, p-1 に変更 */}
            {sourceTypes.map(source => (
              <div
                key={source.value}
                className="border p-1 rounded-lg shadow-sm bg-white flex flex-col items-center justify-center h-20 cursor-pointer hover:bg-gray-50 transition-colors duration-200" // h-20, p-1 に変更
                onClick={() => setSelectedSource(source.value)}
              >
                {/* フォルダアイコン */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* h-8 w-8 に変更 */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h3 className="font-bold text-xs text-gray-800 text-center truncate w-full px-1">{source.label}</h3> {/* text-xs, truncate, px-1 に変更 */}
                <span className="text-[0.6rem] text-gray-500">{results.filter(r => r.type === source.value).length}件</span> {/* text-[0.6rem] に変更 */}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 新規登録・編集用モーダル */}
      {isModalOpen && (
        <div className="fixed inset-x-0 bottom-0 h-4/5 bg-white border-t p-6 space-y-4 z-50 shadow-lg overflow-y-auto rounded-t-lg">
          <h2 className="text-xl font-bold">{editingId ? '編集' : '新規登録'}</h2>
          <select value={inputType} onChange={e => setInputType(e.target.value)} className="w-full border rounded p-3 text-base">
            {sourceTypes.map(source => (
              <option key={source.value} value={source.value}>{source.label}</option>
            ))}
          </select>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="内容" className="w-full border rounded p-3 text-base" rows="4" />
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded p-3 text-base">
            <option value="">カテゴリを選択</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-3 text-base" />

          <h3 className="text-lg font-semibold mt-4">カテゴリ管理</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="新しいカテゴリ名"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="flex-1 border rounded p-3 text-base"
            />
            <button onClick={addCategory} className="bg-green-500 text-white py-3 px-4 rounded text-base">追加</button>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={saveData} className="flex-1 bg-blue-600 text-white py-3 rounded text-base">保存</button>
            <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-400 text-white py-3 rounded text-base">キャンセル</button>
          </div>
        </div>
      )}

      {/* アイテム一覧表示モーダル */}
      {(selectedCategory || selectedSource) && (
        <div className="fixed inset-x-0 bottom-0 h-full bg-white border-t p-4 space-y-4 z-50 shadow-lg overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b">
            <h2 className="text-xl font-bold">
              {selectedCategory ? selectedCategory : sourceTypes.find(s => s.value === selectedSource)?.label}
              のアイテム
            </h2>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSource(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-3xl"
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(selectedCategory
              ? results.filter(item => item.category === selectedCategory)
              : results.filter(item => item.type === selectedSource)
            ).map(item => (
              <div key={item.id} className="border p-4 rounded-lg shadow-sm bg-white">
                <img src={getThumbnail(item.content)} className="w-full h-32 object-contain mb-2 rounded" alt="Thumbnail" />
                <div className="font-semibold text-gray-800">{item.category}（{item.type}）</div>
                <div className="truncate text-sm text-gray-700 mb-1">
                  {item.type === 'url' ? (
                    <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {item.content}
                    </a>
                  ) : (
                    item.content
                  )}
                </div>
                {item.date && <div className="text-xs text-gray-600 mt-1">日時: {formatDateOnly(item.date)}</div>}
                {item.createdAt && <div className="text-xs text-gray-500">保存日時: {formatTimestamp(item.createdAt)}</div>}
                <div className="mt-3 flex justify-between items-center">
                  <button onClick={() => startEdit(item)} className="text-blue-600 text-sm hover:underline">編集</button>
                  <button onClick={() => deleteItem(item.id)} className="text-red-500 text-sm hover:underline">削除</button>
                  <button onClick={() => toggleFavorite(item.id, item.favorite)} className="text-xl">{item.favorite ? '★' : '☆'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
