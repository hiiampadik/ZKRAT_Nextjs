import { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Layout from "../components/Layout";
import ProjectOverlay from "../components/ProjectOverlay";
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
  const [fontLoaded, setFontLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    document.fonts.ready.then(() => setFontLoaded(true));
  }, []);

  useEffect(() => {
    if (!fontLoaded) return;
    // 0.5s title transition + 1s delay before capsules cluster
    const timer = setTimeout(() => setSceneReady(true), 1000);
    return () => clearTimeout(timer);
  }, [fontLoaded]);

  return (
    <Layout>
        <div className={`${styles.homepageTitle} ${fontLoaded ? styles.fontLoaded : ""}`}>
            <h1>
                zkrat.kolektiv
            </h1>
        </div>
        <div className={`${styles.topBar} ${fontLoaded ? styles.fontLoaded : ""}`}>
            <p>
                En
                {/*todo*/}
            </p>
            <button>
                <p>
                    About us
                </p>
            </button>
            <a href="https://www.instagram.com/zkrat.kolektiv/" target="_blank" rel="noopener noreferrer">
                <p>
                    Ig
                </p>
            </a>
        </div>
        <Scene projects={projects} ready={sceneReady} onSelectProject={setSelectedProject} />
        {selectedProject && (
          <ProjectOverlay project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
    </Layout>
  );
}
