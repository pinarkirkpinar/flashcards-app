import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

interface AddWordModalProps {
  visible: boolean;
  onClose: () => void;
  onWordAdded: () => void;
}

export default function AddWordModal({ visible, onClose, onWordAdded }: AddWordModalProps) {
  const [turkish, setTurkish] = useState('');
  const [english, setEnglish] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddWord = async () => {
    if (!turkish.trim() || !english.trim()) {
      Alert.alert('Hata', 'Lütfen her iki alanı da doldurun');
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      
      await addDoc(collection(db, 'words'), {
        turkish: turkish.trim(),
        english: english.trim(),
        userId: userId,
        createdAt: new Date(),
        knownCount: 0,
        unknownCount: 0,
      });

      setTurkish('');
      setEnglish('');
      onWordAdded();
      onClose();
      
      
      setTimeout(() => {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Eklendi!', ToastAndroid.SHORT);
        } else {
          Alert.alert('', 'Eklendi!', [], { cancelable: true });
        }
      }, 300);

    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Yeni Kelime Ekle</Text>

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
            style={styles.addButton} 
            onPress={handleAddWord}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </Text>
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
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
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