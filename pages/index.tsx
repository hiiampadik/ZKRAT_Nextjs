import { useEffect, useState } from "react";
import styles from "../styles/Home.module.scss";
import Layout from "../components/Layout";
import ProjectOverlay from "../components/ProjectOverlay";
import AboutOverlay from "../components/AboutOverlay";
import dynamic from "next/dynamic";
import { getProjects, getAbout, ProjectItem, AboutContent } from "../sanity/queries";
import { GetStaticProps } from "next";

const Scene = dynamic(() => import("../components/Scene"), { ssr: false });

interface HomeProps {
  projects: ProjectItem[];
  about: AboutContent | null;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const [projects, about] = await Promise.all([getProjects(), getAbout()]);
  return {
    props: { projects, about },
    revalidate: 60 * 60 * 24, // Revalidate every hour
  };
};

export default function Home({ projects, about }: HomeProps) {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [lang, setLang] = useState<'en' | 'cs'>('en');

  useEffect(() => {
    document.fonts.ready.then(() => setFontLoaded(true));
  }, []);

  useEffect(() => {
    if (!fontLoaded) return;
    const timer = setTimeout(() => setSceneReady(true), 1000);
    return () => clearTimeout(timer);
  }, [fontLoaded]);

  const openAbout = () => {
    setSelectedProject(null);
    setShowAbout(true);
  };

  const openProject = (project: ProjectItem) => {
    setShowAbout(false);
    setSelectedProject(project);
  };

  return (
    <Layout>
        <div className={`${styles.homepageTitle} ${fontLoaded ? styles.fontLoaded : ""}`}>
            <h1>
                zkrat.kolektiv
            </h1>
        </div>
        <div className={`${styles.topBar} ${fontLoaded ? styles.fontLoaded : ""}`}>
            <button onClick={() => setLang(lang === 'en' ? 'cs' : 'en')}>
                <p>{lang === 'en' ? 'En' : 'Cs'}</p>
            </button>
            <button onClick={openAbout}>
                <p>{lang === 'en' ? 'About us' : 'O nás'}</p>
            </button>
            <a href="https://www.instagram.com/zkrat.kolektiv/" target="_blank" rel="noopener noreferrer">
                <p>
                    Ig
                </p>
            </a>
        </div>
        <Scene projects={projects} ready={sceneReady} onSelectProject={openProject} />
        {selectedProject && (
          <ProjectOverlay project={selectedProject} onClose={() => setSelectedProject(null)} />
        )}
        {showAbout && about && (
          <AboutOverlay about={about} lang={lang} onClose={() => setShowAbout(false)} />
        )}
    </Layout>
  );
}
