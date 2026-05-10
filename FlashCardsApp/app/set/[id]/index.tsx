import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';


interface Word {
  id: string;
  turkish: string;
  english: string;
  knownCount: number;
  unknownCount: number;
}

interface SetData {
  name: string;
  description: string;
  color: string;
}

export default function StudyTab() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [setData, setSetData] = useState<SetData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTurkish, setNewTurkish] = useState('');
  const [newEnglish, setNewEnglish] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTurkish, setEditTurkish] = useState('');
  const [editEnglish, setEditEnglish] = useState('');

  useEffect(() => {
    if (!id) return;

    console.log('🔍 Set ID:', id);
    console.log('👤 User ID:', auth.currentUser?.uid);

    
    const unsubscribeSet = onSnapshot(doc(db, 'sets', id as string), (doc) => {
      if (doc.exists()) {
        console.log('📁 Set bilgisi:', doc.data());
        setSetData(doc.data() as SetData);
      }
    });

    
    const q = query(
      collection(db, 'words'),
      where('setId', '==', id),
      where('userId', '==', auth.currentUser?.uid)
    );

    const unsubscribeWords = onSnapshot(q, (snapshot) => {
      console.log('📦 Kelime sayısı:', snapshot.size);
      
      const wordsData: Word[] = [];
      snapshot.forEach((doc) => {
        console.log('📄 Kelime:', doc.data());
        wordsData.push({ id: doc.id, ...doc.data() } as Word);
      });
      
      console.log('✅ Yüklenen kelimeler:', wordsData);
      setWords(wordsData);
    });

    return () => {
      unsubscribeSet();
      unsubscribeWords();
    };
  }, [id]);

  const handleKnown = async () => {
    if (!currentWord) return;

    console.log('🎯 Bildim butonuna basıldı');
    console.log('📝 Kelime ID:', currentWord.id);
    console.log('📦 Set ID:', id);

    try {
      const wordRef = doc(db, 'words', currentWord.id);
      await updateDoc(wordRef, {
        status: 'known',
        knownCount: (currentWord.knownCount || 0) + 1,
      });

      console.log('✅ Güncelleme başarılı!');
      
      setCurrentIndex((currentIndex + 1) % words.length);
      setShowTranslation(false);
    } catch (error: any) {
      console.log('❌ HATA:', error);
      Alert.alert('Hata', error.message);
    }
  };

  const handleUnknown = async () => {
    if (!currentWord) return;

    try {
      const wordRef = doc(db, 'words', currentWord.id);
      await updateDoc(wordRef, {
        status: 'unknown',
        unknownCount: (currentWord.unknownCount || 0) + 1,
      });

      setCurrentIndex((currentIndex + 1) % words.length);
      setShowTranslation(false);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleAddWord = async () => {
    if (!newTurkish.trim() || !newEnglish.trim()) {
      Alert.alert('Hata', 'Lütfen her iki alanı da doldurun');
      return;
    }

    if (!id || typeof id !== 'string') {
      Alert.alert('Hata', 'Set ID bulunamadı');
      return;
    }

    setAddLoading(true);
    try {
      await addDoc(collection(db, 'words'), {
        setId: id,
        turkish: newTurkish.trim(),
        english: newEnglish.trim(),
        userId: auth.currentUser?.uid,
        createdAt: new Date(),
        knownCount: 0,
        unknownCount: 0,
        status: 'learning',
      });

      setNewTurkish('');
      setNewEnglish('');
      setModalVisible(false);
      
      Alert.alert('Başarı', 'Kelime eklendi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleLongPressCard = () => {
    if (!currentWord) return;

    Alert.alert(
      currentWord.turkish,
      'Ne yapmak istersiniz?',
      [
        {
          text: 'Düzenle',
          onPress: () => {
            setEditTurkish(currentWord.turkish);
            setEditEnglish(currentWord.english);
            setEditModalVisible(true);
          },
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => handleDeleteWord(),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteWord = () => {
    if (!currentWord) return;

    Alert.alert(
      'Kelimeyi Sil',
      `"${currentWord.turkish}" kelimesini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'words', currentWord.id));
              
              
              if (words.length > 1) {
                setCurrentIndex(currentIndex === words.length - 1 ? 0 : currentIndex);
              }
              
              if (Platform.OS === 'android') {
                ToastAndroid.show('Kelime silindi', ToastAndroid.SHORT);
              } else {
                Alert.alert('Başarı', 'Kelime silindi');
              }
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateWord = async () => {
    if (!currentWord || !editTurkish.trim() || !editEnglish.trim()) {
      Alert.alert('Hata', 'Lütfen her iki alanı da doldurun');
      return;
    }

    try {
      await updateDoc(doc(db, 'words', currentWord.id), {
        turkish: editTurkish.trim(),
        english: editEnglish.trim(),
      });

      setEditModalVisible(false);
      setEditTurkish('');
      setEditEnglish('');

      if (Platform.OS === 'android') {
        ToastAndroid.show('Kelime güncellendi', ToastAndroid.SHORT);
      } else {
        Alert.alert('Başarı', 'Kelime güncellendi');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const currentWord = words[currentIndex];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: setData?.color || '#007AFF' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Setler</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{setData?.name || 'Yükleniyor...'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {words.length === 0 ? (
        <>
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.placeholderWord}>Kelime</Text>
              <Text style={styles.tapHint}>Henüz kelime eklenmedi</Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.wrongButton, styles.disabledButton]}
              disabled
            >
              <Text style={styles.actionButtonText}>Bilemedim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.correctButton, styles.disabledButton]}
              disabled
            >
              <Text style={styles.actionButtonText}>Bildim</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addWordButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addWordButtonText}>+ Yeni Kelime Ekle</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => setShowTranslation(!showTranslation)}
              onLongPress={handleLongPressCard}
            >
              <Text style={styles.word}>
                {showTranslation ? currentWord.english : currentWord.turkish}
              </Text>
              <Text style={styles.tapHint}>Kartı çevirmek için dokun</Text>
              <Text style={styles.editHint}>💡 Düzenlemek için uzun basın</Text>
            </TouchableOpacity>
          </View>

          {words.length > 1 && (
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  setCurrentIndex(currentIndex === 0 ? words.length - 1 : currentIndex - 1);
                  setShowTranslation(false);
                }}
              >
                <Text style={styles.navButtonText}>← Önceki</Text>
              </TouchableOpacity>

              <Text style={styles.counterText}>
                {currentIndex + 1} / {words.length}
              </Text>

              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  setCurrentIndex((currentIndex + 1) % words.length);
                  setShowTranslation(false);
                }}
              >
                <Text style={styles.navButtonText}>Sonraki →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.wrongButton]}
              onPress={handleUnknown}
            >
              <Text style={styles.actionButtonText}>Bilemedim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.correctButton]}
              onPress={handleKnown}
            >
              <Text style={styles.actionButtonText}>Bildim</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addWordButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addWordButtonText}>+ Yeni Kelime Ekle</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {}}
        >
          <Text style={styles.tabIcon}>🎯</Text>
          <Text style={[styles.tabText, styles.activeTab]}>Çalış</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.replace(`/set/${id}/known`)}
        >
          <Text style={styles.tabIcon}>✅</Text>
          <Text style={styles.tabText}>Bildiklerim</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.replace(`/set/${id}/unknown`)}
        >
          <Text style={styles.tabIcon}>❌</Text>
          <Text style={styles.tabText}>Bilmediklerim</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.replace(`/set/${id}/stats`)}
        >
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabText}>İstatistikler</Text>
        </TouchableOpacity>
      </View>

      
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Kelime Ekle</Text>

            <TextInput
              style={styles.input}
              placeholder="Kelime"
              placeholderTextColor="#999"
              value={newTurkish}
              onChangeText={setNewTurkish}
            />

            <TextInput
              style={styles.input}
              placeholder="Anlamı"
              placeholderTextColor="#999"
              value={newEnglish}
              onChangeText={setNewEnglish}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleAddWord}
              disabled={addLoading}
            >
              <Text style={styles.createButtonText}>
                {addLoading ? 'Ekleniyor...' : 'Ekle'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setNewTurkish('');
                setNewEnglish('');
              }}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kelimeyi Düzenle</Text>

            <TextInput
              style={styles.input}
              placeholder="Kelime"
              placeholderTextColor="#999"
              value={editTurkish}
              onChangeText={setEditTurkish}
            />

            <TextInput
              style={styles.input}
              placeholder="Anlamı"
              placeholderTextColor="#999"
              value={editEnglish}
              onChangeText={setEditEnglish}
            />

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateWord}
            >
              <Text style={styles.updateButtonText}>Güncelle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditModalVisible(false);
                setEditTurkish('');
                setEditEnglish('');
              }}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    height: 300,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  word: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  placeholderWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ccc',
    marginBottom: 10,
  },
  hint: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  tapHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
  },
  editHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  navButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  counterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  wrongButton: {
    backgroundColor: '#FF3B30',
  },
  correctButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.4,
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addWordButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addWordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  activeTab: {
    color: '#007AFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});