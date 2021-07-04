import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  // eslint-disable-next-line prefer-const
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState(results);
  const [carregarMais, setCarregarMais] = useState(next_page);
  const [carregando, setCarregando] = useState(false);
  // console.log(posts);

  const maisPosts = (link: string): void => {
    setCarregando(true);
    fetch(link)
      .then(res => res.json())
      .then(data => {
        setCarregarMais(data.next_page);
        const filteredNewResults = data.results.map(result => {
          return {
            uid: result.uid,
            first_publication_date: result.first_publication_date,
            data: result.data,
          };
        });
        // console.log(filteredNewResults);
        setPosts([...posts, ...filteredNewResults]);
        setCarregando(false);
      });
    // console.log(posts);
  };

  return (
    <>
      <Header />
      <div className={commonStyles.contentContainer}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <a>
              <div className={styles.postButton}>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <FiCalendar />
                  <small>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </small>
                  <FiUser />
                  <small>{post.data.author}</small>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {carregarMais && (
          <button
            className={styles.maisPosts}
            type="button"
            onClick={e => maisPosts(carregarMais)}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );
  // console.log(JSON.stringify(postsResponse, null, 2));
  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post?.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  const postsPagination = {
    next_page: postsResponse?.next_page,
    results,
  };
  return {
    props: {
      postsPagination,
    },
  };
};
