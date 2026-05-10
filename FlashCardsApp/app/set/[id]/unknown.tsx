import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';

interface Word {
  id: string;
  turkish: string;
  english: string;
  status?: string;
}

export default function UnknownWordsTab() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [unknownWords, setUnknownWords] = useState<Word[]>([]);
  const [showTranslation, setShowTranslation] = useState<{[key: string]: boolean}>({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [editTurkish, setEditTurkish] = useState('');
  const [editEnglish, setEditEnglish] = useState('');

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'words'),
      where('setId', '==', id),
      where('userId', '==', auth.currentUser?.uid),
      where('status', '==', 'unknown')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wordsData: Word[] = [];
      snapshot.forEach((doc) => {
        wordsData.push({ id: doc.id, ...doc.data() } as Word);
      });
      setUnknownWords(wordsData);
    });

    return () => unsubscribe();
  }, [id]);

  const toggleTranslation = (wordId: string) => {
    setShowTranslation(prev => ({
      ...prev,
      [wordId]: !prev[wordId]
    }));
  };

  const handleLongPress = (word: Word) => {
    Alert.alert(
      word.turkish,
      'Ne yapmak istersiniz?',
      [
        {
          text: 'Düzenle',
          onPress: () => {
            setSelectedWord(word);
            setEditTurkish(word.turkish);
            setEditEnglish(word.english);
            setEditModalVisible(true);
          },
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => handleDelete(word),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDelete = async (word: Word) => {
    Alert.alert(
      'Kelimeyi Sil',
      `"${word.turkish}" kelimesini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'words', word.id));
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

  const handleUpdate = async () => {
    if (!selectedWord || !editTurkish.trim() || !editEnglish.trim()) {
      Alert.alert('Hata', 'Lütfen her iki alanı da doldurun');
      return;
    }

    try {
      await updateDoc(doc(db, 'words', selectedWord.id), {
        turkish: editTurkish.trim(),
        english: editEnglish.trim(),
      });

      setEditModalVisible(false);
      setSelectedWord(null);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bilmediklerim ❌</Text>
        <Text style={styles.subtitle}>Toplam: {unknownWords.length} kelime</Text>
        <Text style={styles.hintText}>💡 Düzenlemek için karta uzun basın</Text>
      </View>

      {unknownWords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz bilmediğiniz kelime yok</Text>
          <Text style={styles.emptySubtext}>Çalış sekmesinde "Bilemedim" butonuna basın</Text>
        </View>
      ) : (
        <FlatList
          data={unknownWords}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.wordCard}
              onPress={() => toggleTranslation(item.id)}
              onLongPress={() => handleLongPress(item)}
            >
              <Text style={styles.wordText}>
                {showTranslation[item.id] ? item.english : item.turkish}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

     
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.replace(`/set/${id}`)}
        >
          <Text style={styles.tabIcon}>🎯</Text>
          <Text style={styles.tabText}>Çalış</Text>
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
          onPress={() => {}}
        >
          <Text style={styles.tabIcon}>❌</Text>
          <Text style={[styles.tabText, styles.activeTab]}>Bilmediklerim</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => router.replace(`/set/${id}/stats`)}
        >
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={styles.tabText}>İstatistikler</Text>
        </TouchableOpacity>
      </View>

      
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kelimeyi Düzenle</Text>

            <TextInput
              style={styles.input}
              placeholder="Türkçe kelime"
              placeholderTextColor="#999"
              value={editTurkish}
              onChangeText={setEditTurkish}
            />

            <TextInput
              style={styles.input}
              placeholder="İngilizce karşılığı"
              placeholderTextColor="#999"
              value={editEnglish}
              onChangeText={setEditEnglish}
            />

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Güncelle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditModalVisible(false);
                setSelectedWord(null);
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 20,
    fontWeight: '600',
  },
  hintTextCard: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
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