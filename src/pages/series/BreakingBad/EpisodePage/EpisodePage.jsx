// SharedEpisodePage'e geçilen prop'lar bu seriye özgü değerleri belirler.
// Ortak mekanik (cinematic reveal, crossfade, scroll→header) SharedEpisodePage'de yaşar.
import SharedEpisodePage from '../../shared/EpisodePage/SharedEpisodePage';
import * as seriesData from '../BreakingBad.data';
import { EpisodeBrief } from './EpisodeBrief/EpisodeBrief';
import { EpisodeBlocks } from './EpisodeBlocks/EpisodeBlocks';
import { getRelatedBlogs } from './RelatedContent/RelatedContent.data';

export default function EpisodePage() {
  return (
    <SharedEpisodePage
      seriesSlug="breaking-bad"
      seriesData={seriesData}
      EpisodeBrief={EpisodeBrief}
      EpisodeBlocks={EpisodeBlocks}
      getRelatedBlogs={getRelatedBlogs}
    />
  );
}
