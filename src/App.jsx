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
      await addDoc(collection(db, '
