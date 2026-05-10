import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';

interface Word {
  id: string;
  turkish: string;
  english: string;
  knownCount: number;
  unknownCount: number;
}

interface Stats {
  total: number;
  known: number;
  unknown: number;
}

export default function StatsTab() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, known: 0, unknown: 0 });

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'words'),
      where('setId', '==', id),
      where('userId', '==', auth.currentUser?.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const wordsData: Word[] = [];
      let total = 0;
      let known = 0;
      let unknown = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        wordsData.push({ id: doc.id, ...data } as Word);
        total++;

        if (data.status === 'known') {
          known++;
        } else if (data.status === 'unknown') {
          unknown++;
        }
      });

      setWords(wordsData);
      setStats({ total, known, unknown });

      
      await updateDoc(doc(db, 'sets', id as string), {
        wordCount: total,
      });
    });

    return () => unsubscribe();
  }, [id]);

  const handleDeleteWord = (wordId: string, word: string) => {
    Alert.alert(
      'Kelimeyi Sil',
      `"${word}" kelimesini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'words', wordId));
              if (Platform.OS === 'android') {
                ToastAndroid.show('Kelime silindi', ToastAndroid.SHORT);
              }
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  const getPercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 İstatistikler</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Toplam Kelime</Text>
          <Text style={styles.cardValue}>{stats.total}</Text>
        </View>

        <View style={[styles.card, styles.knownCard]}>
          <Text style={styles.cardTitle}>✅ Bildiklerim</Text>
          <Text style={styles.cardValue}>{stats.known}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, styles.knownFill, { width: `${getPercentage(stats.known)}%` }]} />
          </View>
          <Text style={styles.percentage}>{getPercentage(stats.known)}%</Text>
        </View>

        <View style={[styles.card, styles.unknownCard]}>
          <Text style={styles.cardTitle}>❌ Bilmediklerim</Text>
          <Text style={styles.cardValue}>{stats.unknown}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, styles.unknownFill, { width: `${getPercentage(stats.unknown)}%` }]} />
          </View>
          <Text style={styles.percentage}>{getPercentage(stats.unknown)}%</Text>
        </View>

        <View style={styles.wordsSection}>
          <Text style={styles.sectionTitle}>Tüm Kelimeler ({words.length})</Text>
          {words.map((word) => (
            <TouchableOpacity
              key={word.id}
              style={styles.wordItem}
              onLongPress={() => handleDeleteWord(word.id, word.turkish)}
            >
              <View>
                <Text style={styles.wordTurkish}>{word.turkish}</Text>
                <Text style={styles.wordEnglish}>{word.english}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      
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
          onPress={() => router.replace(`/set/${id}/unknown`)}
        >
          <Text style={styles.tabIcon}>❌</Text>
          <Text style={styles.tabText}>Bilmediklerim</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => {}}
        >
          <Text style={styles.tabIcon}>📊</Text>
          <Text style={[styles.tabText, styles.activeTab]}>İstatistikler</Text>
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#666',
  },
  cardValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  knownCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  unknownCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  knownFill: {
    backgroundColor: '#34C759',
  },
  unknownFill: {
    backgroundColor: '#FF3B30',
  },
  percentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  wordsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  wordItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  wordTurkish: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  wordEnglish: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
});