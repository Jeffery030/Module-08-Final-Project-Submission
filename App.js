import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();
const token = process.env.EXPO_PUBLIC_TMDB_TOKEN;
const api = 'https://api.themoviedb.org/3';
const image = 'https://image.tmdb.org/t/p/w500';

async function getData(url) {
  if (!token || token.includes('PASTE_')) {
    throw new Error('Add your TMDB token to the .env file.');
  }

  const response = await fetch(api + url, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Could not retrieve movie data.');
  }

  return response.json();
}

function MovieCard({ movie, navigation }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('Details', { id: movie.id })}
    >
      {movie.poster_path ? (
        <Image source={{ uri: image + movie.poster_path }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.noImage]}>
          <Text>No Image</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.movieTitle}>{movie.title}</Text>
        <Text style={styles.movieText}>Rating: {movie.vote_average?.toFixed(1)}/10</Text>
        <Text style={styles.movieText}>Release: {movie.release_date || 'Unknown'}</Text>
        <Text style={styles.viewText}>View Details</Text>
      </View>
    </Pressable>
  );
}

function HomeScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMovies() {
    try {
      setLoading(true);
      setError('');
      const data = await getData('/movie/popular?language=en-US&page=1');
      setMovies(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.statusText}>Loading movies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.button} onPress={loadMovies}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Movie Explorer</Text>
        <Text style={styles.subheading}>Popular Movies from TMDB</Text>
      </View>

      <Pressable style={styles.searchButton} onPress={() => navigation.navigate('Search')}>
        <Text style={styles.searchButtonText}>Search for a Movie</Text>
      </Pressable>

      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieCard movie={item} navigation={navigation} />}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadMovies}
      />
    </SafeAreaView>
  );
}

function SearchScreen({ navigation }) {
  const [text, setText] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Enter a movie title.');

  async function search() {
    if (!text.trim()) {
      setMessage('Enter a movie title.');
      setMovies([]);
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      const data = await getData(
        `/search/movie?query=${encodeURIComponent(text.trim())}&include_adult=false&language=en-US&page=1`
      );
      setMovies(data.results || []);
      if (!data.results?.length) {
        setMessage('No movies found.');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Enter movie title"
          placeholderTextColor="#777"
          returnKeyType="search"
          onSubmitEditing={search}
        />
        <Pressable style={styles.smallButton} onPress={search}>
          <Text style={styles.buttonText}>Search</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.statusText}>Searching...</Text>
        </View>
      ) : message ? (
        <View style={styles.center}>
          <Text style={styles.statusText}>{message}</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <MovieCard movie={item} navigation={navigation} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

function DetailsScreen({ route }) {
  const { id } = route.params;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDetails() {
    try {
      setLoading(true);
      setError('');
      const data = await getData(`/movie/${id}?language=en-US`);
      setMovie(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.statusText}>Loading details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.button} onPress={loadDetails}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.details}>
      {movie.poster_path ? (
        <Image source={{ uri: image + movie.poster_path }} style={styles.largePoster} />
      ) : null}

      <Text style={styles.detailsTitle}>{movie.title}</Text>
      <Text style={styles.detailsText}>Rating: {movie.vote_average?.toFixed(1)}/10</Text>
      <Text style={styles.detailsText}>Release Date: {movie.release_date || 'Unknown'}</Text>
      <Text style={styles.detailsText}>Runtime: {movie.runtime || 'Unknown'} minutes</Text>

      <Text style={styles.sectionTitle}>Genres</Text>
      <Text style={styles.overview}>
        {movie.genres?.map((genre) => genre.name).join(', ') || 'No genres available.'}
      </Text>

      <Text style={styles.sectionTitle}>Overview</Text>
      <Text style={styles.overview}>{movie.overview || 'No overview available.'}</Text>

      <Text style={styles.credit}>
        Movie information and images provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
      </Text>
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#172554' },
          headerTintColor: 'white',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Movie Explorer' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Movies' }} />
        <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Movie Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    backgroundColor: '#172554',
    alignItems: 'center',
    padding: 18,
  },
  heading: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  subheading: {
    color: '#dbeafe',
    marginTop: 5,
  },
  list: {
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 7,
    backgroundColor: '#ddd',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  movieTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  movieText: {
    color: '#555',
    marginBottom: 6,
  },
  viewText: {
    color: '#2563eb',
    fontWeight: 'bold',
    marginTop: 7,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#f2f2f2',
  },
  statusText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: '#b91c1c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    margin: 12,
    padding: 13,
    alignItems: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 7,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  smallButton: {
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginLeft: 8,
    borderRadius: 7,
  },
  details: {
    alignItems: 'center',
    padding: 18,
  },
  largePoster: {
    width: 240,
    height: 360,
    borderRadius: 10,
  },
  detailsTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 7,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 21,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  overview: {
    alignSelf: 'flex-start',
    fontSize: 16,
    lineHeight: 23,
    color: '#444',
  },
  credit: {
    fontSize: 11,
    color: '#777',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
});
