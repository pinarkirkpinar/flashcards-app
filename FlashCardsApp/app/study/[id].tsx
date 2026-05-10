import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

interface Word {
  id: string;
  turkish: string;
  english: string;
  knownCount: number;
  unknownCount: number;
}

export default function StudyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'words'),
      where('setId', '==', id),
      where('userId', '==', auth.currentUser?.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wordsData: Word[] = [];
      snapshot.forEach((doc) => {
        wordsData.push({ id: doc.id, ...doc.data() } as Word);
      });
      setWords(wordsData);
    });

    return () => unsubscribe();
  }, [id]);

  const handleKnown = async () => {
    if (!currentWord) return;

    try {
      const wordRef = doc(db, 'words', currentWord.id);
      await updateDoc(wordRef, {
        status: 'known',
        knownCount: currentWord.knownCount + 1,
      });

      setCurrentIndex((currentIndex + 1) % words.length);
      setShowTranslation(false);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleUnknown = async () => {
    if (!currentWord) return;

    try {
      const wordRef = doc(db, 'words', currentWord.id);
      await updateDoc(wordRef, {
        status: 'unknown',
        unknownCount: currentWord.unknownCount + 1,
      });

      setCurrentIndex((currentIndex + 1) % words.length);
      setShowTranslation(false);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const currentWord = words[currentIndex];

  if (words.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Kelime yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>
          {currentIndex + 1} / {words.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowTranslation(!showTranslation)}
        >
          <Text style={styles.word}>
            {showTranslation ? currentWord.english : currentWord.turkish}
          </Text>
          <Text style={styles.hint}>
            {showTranslation ? '🇬🇧 İngilizce' : '🇹🇷 Türkçe'}
          </Text>
          <Text style={styles.tapHint}>Kartı çevirmek için dokun</Text>
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.wrongButton]}
          onPress={handleUnknown}
        >
          <Text style={styles.actionButtonText}>Bilmedim</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.correctButton]}
          onPress={handleKnown}
        >
          <Text style={styles.actionButtonText}>Bildim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  counter: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  emptyText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
});