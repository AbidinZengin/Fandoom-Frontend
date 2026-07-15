import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { ContentSection } from '../components/ContentSection';
import { Footer } from '../components/Footer';
import { theories, news, blogPosts } from '../data/content';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturedCarousel />

      <ContentSection
        heading="Top Theories"
        items={theories}
        renderMeta={(item) => (
          <>
            <span>{item.author}</span>
            <span>&middot;</span>
            <span>{item.votes} votes</span>
          </>
        )}
      />

      <ContentSection
        heading="Latest News"
        items={news}
        renderMeta={(item) => <span>{item.date}</span>}
      />

      <ContentSection
        heading="Featured Blog Posts"
        items={blogPosts}
        renderMeta={(item) => <span>{item.readTime}</span>}
      />

      <Footer />
    </>
  );
}
