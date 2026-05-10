import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

interface EditWordModalProps {
  visible: boolean;
  onClose: () => void;
  word: {
    id: string;
    turkish: string;
    english: string;
  } | null;
}

export default function EditWordModal({ visible, onClose, word }: EditWordModalProps) {
  const [turkish, setTurkish] = useState(word?.turkish || '');
  const [english, setEnglish] = useState(word?.english || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (word) {
      setTurkish(word.turkish);
      setEnglish(word.english);
    }
  }, [word]);

  const handleUpdate = async () => {
    if (!turkish.trim() || !english.trim()) {
      Alert.alert('Hata', 'Lütfen her iki alanı da doldurun');
      return;
    }

    if (!word) return;

    setLoading(true);
    try {
      const wordRef = doc(db, 'words', word.id);
      await updateDoc(wordRef, {
        turkish: turkish.trim(),
        english: english.trim(),
      });

      onClose();
      
      setTimeout(() => {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Güncellendi!', ToastAndroid.SHORT);
        } else {
          Alert.alert('', 'Güncellendi!', [], { cancelable: true });
        }
      }, 300);

    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!word) return;

    Alert.alert(
      'Kelimeyi Sil',
      'Bu kelimeyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const wordRef = doc(db, 'words', word.id);
              await deleteDoc(wordRef);
              onClose();
              
              setTimeout(() => {
                if (Platform.OS === 'android') {
                  ToastAndroid.show('Silindi!', ToastAndroid.SHORT);
                } else {
                  Alert.alert('', 'Silindi!', [], { cancelable: true });
                }
              }, 300);
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Kelimeyi Düzenle</Text>

          <TextInput
            style={styles.input}
            placeholder="Türkçe kelime"
            placeholderTextColor="#999"
            value={turkish}
            onChangeText={setTurkish}
          />

          <TextInput
            style={styles.input}
            placeholder="İngilizce karşılığı"
            placeholderTextColor="#999"
            value={english}
            onChangeText={setEnglish}
          />

          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={handleUpdate}
            disabled={loading}
          >
            <Text style={styles.updateButtonText}>
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Kelimeyi Sil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  title: {
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
    backgroundColor: '#007AFF',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
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