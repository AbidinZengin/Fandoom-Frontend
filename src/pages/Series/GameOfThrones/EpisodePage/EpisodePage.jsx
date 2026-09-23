import SharedEpisodePage from '../../shared/EpisodePage/SharedEpisodePage';
import * as seriesData from '../GameOfThrones.data';
import { EpisodeBrief } from './EpisodeBrief/EpisodeBrief';
import { EpisodeBlocks } from './EpisodeBlocks/EpisodeBlocks';
import { getRelatedBlogs } from './RelatedContent/RelatedContent.data';

export default function EpisodePage() {
  return (
    <SharedEpisodePage
      seriesSlug="game-of-thrones"
      seriesData={seriesData}
      EpisodeBrief={EpisodeBrief}
      EpisodeBlocks={EpisodeBlocks}
      getRelatedBlogs={getRelatedBlogs}
    />
  );
}
