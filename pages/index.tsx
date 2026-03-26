import styles from "../styles/Home.module.scss";
import Layout from "../components/Layout";

export default function Home() {

  return (
    <Layout>
          <div className={styles.homepageTitle}>
              <a href='https://instagram.com/zkrat.kolektiv'>
                <h1>
                    @zkrat.kolektiv
                </h1>
                <span className={styles.ig}>IG</span>
              </a>
              <p>
                  Interactive Installations
              </p>
              <p>
                  Visualizations
              </p>
            </div>
    </Layout>
  );
}
