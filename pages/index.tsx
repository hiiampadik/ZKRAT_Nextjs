import styles from "../styles/Home.module.scss";
import Layout from "../components/Layout";
import dynamic from "next/dynamic";
import { getProjects, ProjectItem } from "../sanity/queries";
import { GetStaticProps } from "next";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

interface HomeProps {
  projects: ProjectItem[];
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const projects = await getProjects();
  return {
    props: { projects },
    revalidate: 60,
  };
};

export default function Home({ projects }: HomeProps) {
  return (
    <Layout>
        <div className={styles.homepageTitle}>
            <h1>
                zkrat.kolektiv
            </h1>
        </div>
        <Scene projects={projects} />
    </Layout>
  );
}
