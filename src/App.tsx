import { useNavigation } from './hooks/useNavigation';
import HomePage from './pages/HomePage';
import AlphabetPage from './pages/AlphabetPage';
import VocabularyPage from './pages/VocabularyPage';
import DialoguePage from './pages/DialoguePage';
import FlashcardPage from './pages/FlashcardPage';
import TonePage from './pages/TonePage';

function App() {
  const { page, navigate, goBack } = useNavigation();

  switch (page) {
    case 'alphabet':
      return <AlphabetPage goBack={goBack} />;
    case 'vocabulary':
      return <VocabularyPage goBack={goBack} />;
    case 'dialogue':
      return <DialoguePage goBack={goBack} />;
    case 'flashcard':
      return <FlashcardPage goBack={goBack} />;
    case 'tone':
      return <TonePage goBack={goBack} />;
    default:
      return <HomePage navigate={navigate} />;
  }
}

export default App;
