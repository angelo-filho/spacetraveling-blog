import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';

import { FiCalendar, FiUser } from 'react-icons/fi';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { formatDate } from '../utils/formatDate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [results, setResults] = useState<Post[] | null>(
    postsPagination.results
  );
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  async function handleLoadMorePosts() {
    const response = await fetch(nextPage);
    const data = await response.json();

    const dataResults: Post[] = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: formatDate(post.first_publication_date),
        data: {
          author: post.data.author,
          title: post.data.title,
          subtitle: post.data.subtitle,
        },
      };
    });

    const next_page = data.next_page;

    setNextPage(next_page);
    setResults(r => [...r, ...dataResults]);
  }

  return (
    <main className={commonStyles.container}>
      <div className={styles.postsList}>
        {results?.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <h3>{post.data.title}</h3>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <FiCalendar size={'1.25rem'} />
                  {post.first_publication_date}
                </time>
                <span>
                  <FiUser size={'1.25rem'} />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>
      {nextPage && (
        <button
          type="button"
          className={styles.loudMorePostButton}
          onClick={handleLoadMorePosts}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    fetch: ['posts.uid', 'posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  });

  const results: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: formatDate(post.first_publication_date),
      data: {
        author: post.data.author,
        title: post.data.title,
        subtitle: post.data.subtitle,
      },
    };
  });

  const next_page = postsResponse.next_page;

  return {
    props: { postsPagination: { next_page, results } },
  };
};
