import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

interface WordSet {
  id: string;
  name: string;
  description: string;
  color: string;
  wordCount: number;
}

export default function SetsScreen() {
  const router = useRouter();
  const [sets, setSets] = useState<WordSet[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(collection(db, 'sets'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const setsData: WordSet[] = [];
      snapshot.forEach((doc) => {
        setsData.push({ id: doc.id, ...doc.data() } as WordSet);
      });
      setSets(setsData);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/screens/LoginScreen');
  };

  const handleCreateSet = async () => {
    if (!setName.trim()) {
      Alert.alert('Hata', 'Lütfen set adı girin');
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      await addDoc(collection(db, 'sets'), {
        name: setName.trim(),
        description: setDescription.trim(),
        userId: userId,
        color: getRandomColor(),
        wordCount: 0,
        createdAt: new Date(),
      });

      setSetName('');
      setSetDescription('');
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleDeleteSet = (setId: string, setName: string) => {
    Alert.alert(
      'Seti Sil',
      `"${setName}" setini silmek istediğinizden emin misiniz? İçindeki tüm kelimeler silinecek!`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'sets', setId));
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Kelime Setlerim</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {sets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz set oluşturmadınız</Text>
          <Text style={styles.emptySubtext}>İngilizce, İtalyanca, Almanca gibi setler oluşturun!</Text>
        </View>
      ) : (
        <FlatList
          data={sets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.setCard, { borderLeftColor: item.color }]}
              onPress={() => router.push(`/set/${item.id}` as any)}
              onLongPress={() => handleDeleteSet(item.id, item.name)}
            >
              <View style={styles.setInfo}>
                <Text style={styles.setName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.setDescription}>{item.description}</Text>
                ) : null}
                <Text style={styles.wordCount}>
                  {item.wordCount || 0} kelime
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Yeni Set Oluştur</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Set Oluştur</Text>

            <TextInput
              style={styles.input}
              placeholder="Set Adı (örn: İngilizce)"
              placeholderTextColor="#999"
              value={setName}
              onChangeText={setSetName}
            />

            <TextInput
              style={styles.input}
              placeholder="Açıklama (opsiyonel)"
              placeholderTextColor="#999"
              value={setDescription}
              onChangeText={setSetDescription}
            />

            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateSet}
            >
              <Text style={styles.createButtonText}>Oluştur</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setModalVisible(false);
                setSetName('');
                setSetDescription('');
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  setCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  setDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  wordCount: {
    fontSize: 14,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
  },
  addButton: {
    margin: 20,
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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