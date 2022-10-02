import { asHTML, asText } from '@prismicio/helpers';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../utils/formatDate';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const [readingTime, setReadingTime] = useState<number | null>();
  const { isFallback } = useRouter();

  useEffect(() => {
    const allLetters = post.data.content.reduce((a, b) => {
      return a + b.heading.split(' ').length + asText(b.body).split(' ').length;
    }, 0);

    console.log(allLetters);

    setReadingTime(Math.ceil(allLetters / 200));
  }, []);

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <div className={styles.imageContainer}>
        <img src={post.data.banner.url} alt="banner" />
      </div>

      <main className={commonStyles.container}>
        <div className={styles.informations}>
          <h1>{post.data.title}</h1>
          <div>
            <time>
              <FiCalendar size={'1.25rem'} />
              {post.first_publication_date}
            </time>
            <span>
              <FiUser size={'1.25rem'} />
              {post.data.author}
            </span>
            <span>
              <FiClock size={'1.25rem'} />
              {readingTime} min
            </span>
          </div>
        </div>

        <section>
          {post.data.content.map(content => (
            <div className={styles.readingArea} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{
                  __html: String(asHTML(content.body)),
                }}
              ></div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const postsPaths = posts.results.map(post => {
    return `/post/${post.uid}`;
  });

  return {
    paths: [...postsPaths],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug));

  const post: Post = {
    first_publication_date: formatDate(response.first_publication_date),
    data: {
      banner: response.data.banner,
      title: response.data.title,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: { post },
  };
};
