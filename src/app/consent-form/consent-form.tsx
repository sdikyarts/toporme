"use client";

import { useState } from "react";
import { advanceProgress } from "../progress-action";
import ProgressButton from "../progress-button";

const submitConsent = advanceProgress.bind(null, "consent-form");

export default function ConsentForm() {
    const [consent, setConsent] = useState("");

    return (
        <main>
            <div className="consent-container">
                <h1>Informed Consent Form</h1>
                <form className="consent-form" action={submitConsent}>
                    <div className="consent-text">
                        <div className="consent-text-item">
                            <h1>Penjelasan dan Informed Consent Form</h1>
                            <p>Aktivitas ini diperuntukkan untuk memberikan bantuan belajar dan masukan untuk peningkatan proses pembelajaran pada mata kuliah struktur data dan algoritma (SDA) serta menjadi masukan bagi penelitian di bidang pembelajaran berbantuan komputer yang memiliki judul tentatif Pengembangan Aplikasi Latihan Simulasi Reflektif: Studi Kasus Topik Struktur Data dan Algoritma apabila teman-teman berkenan.</p>
                        </div>
                        <div className="consent-text-item">
                            <h1>Tujuan dan Deskripsi Penelitian</h1>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>
                                    Penelitian ini bertujuan untuk mengidentifikasi pengalaman mahasiswa ketika
                                    mengerjakan latihan soal Struktur Data dan Algoritma (SDA) sebagai dasar
                                    perancangan aplikasi Online Reflective Modular Exercise (ORME).
                                </li>
                                <li>
                                    Penelitian ini memiliki relevansi dan urgensi yang tinggi mengingat SDA
                                    merupakan salah satu subjek yang menuntut beban tinggi.
                                </li>
                            </ul>
                        </div>
                        <div className="consent-text-item">
                            <h1>Prosedur Penelitian dan Bentuk Partisipasi</h1>
                            <p>Penelitian ini merupakan bagian dari tahap evaluasi terhadap aplikasi Online Reflective Modular Exercise (ORME) yang bernama TopORME. Pada awalnya, teman-teman akan diminta untuk menjalankan aplikasi TopORME. Setelah menjalankan aplikasi TopORME, teman-teman akan diminta untuk mengisi kuesioner System Usability Scale (SUS) dan Metacognitive Laziness Scale (MLS), serta berpartisipasi dalam wawancara kontekstual singkat mengenai pengalaman menggunakan TopORME, termasuk pengalaman ketika mengerjakan latihan soal secara modular dan reflektif serta kendala yang dirasakan selama pengerjaan. Kontribusi partisipan yang diharapkan adalah menyelesaikan sesi pengerjaan ORME, kemudian mengikuti wawancara kontekstual ini hingga selesai, dengan durasi kurang lebih 30-45 menit.</p>
                        </div>
                        <div className="consent-text-item">
                            <h1>Manfaat dan Risiko</h1>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>
                                    <b>Manfaat:</b> Berkontribusi bagi peningkatan pengalaman belajar di kelas SDA.
                                </li>
                                <li>
                                    <b>Risiko:</b> Terdapat risiko berupa terambilnya waktu sebanyak 45 menit untuk menyelesaikan aktivitas ini. Risiko potensial lainnya adalah risiko kebocoran data yang sangat kecil kemungkinan terjadi dikarenakan anonimisasi dan penyimpanan data di tempat yang aman.
                                </li>
                            </ul>
                        </div>
                        <div className="consent-text-item">
                            <h1>Privasi dan Kerahasiaan</h1>
                            <p>Jika Anda bersedia berpartisipasi, kami mencatat durasi dan hasil (selesai atau dilewati) percobaan pertama di bagian Pengantar, Tutorial, dan Latihan. Kami menggunakan Microsoft Clarity pada ketiga bagian tersebut untuk merekam interaksi dengan halaman dan membuat peta klik.</p>
                            <p>Penelitian ini merupakan bagian dari tahap evaluasi terhadap aplikasi Online Reflective Modular Exercise (ORME) yang bernama TopORME. Pada awalnya, teman-teman akan diminta untuk menjalankan aplikasi TopORME. Setelah menjalankan aplikasi TopORME, teman-teman akan diminta untuk mengisi kuesioner System Usability Scale (SUS) dan Metacognitive Laziness Scale (MLS), serta berpartisipasi dalam wawancara kontekstual singkat mengenai pengalaman menggunakan TopORME, termasuk pengalaman ketika mengerjakan latihan soal secara modular dan reflektif serta kendala yang dirasakan selama pengerjaan. Kontribusi partisipan yang diharapkan adalah menyelesaikan sesi pengerjaan ORME, kemudian mengikuti wawancara kontekstual ini hingga selesai, dengan durasi kurang lebih 30-45 menit.</p>
                        </div>
                        <div className="consent-text-item">
                            <h1>Hak Partisipan</h1>
                            <p>Partisipan berhak untuk menolak berpartisipasi dan menarik diri kapan saja tanpa konsekuensi. Semua isian pada kuesioner ini tidak akan mempengaruhi penilaian,</p>
                        </div>
                        <div className="consent-text-item">
                            <h1>Kontak Informasi</h1>
                            <p>Yasmine Putri Viryadhani (yasmineputrivir@gmail.com)</p>
                        </div>
                        <div className="consent-text-item">
                            <h1>Dosen Pembimbing</h1>
                            <p>Lintang Matahari Hasani, S.Kom., M.Kom., Ph.D.</p>
                            <p>Dr. Eng. Lia Sadita, S.Kom., M.Eng.</p>
                        </div>
                    </div>
                    <svg className="consent-divider" viewBox="0 0 966 2" aria-hidden="true">
                        <path d="M1 1H965" />
                    </svg>
                    <div className="options">
                        <div className="option">
                            <div className="option-item">
                                <input
                                    type="radio"
                                    id="bersedia"
                                    name="consent"
                                    value="yes"
                                    onChange={(event) => setConsent(event.currentTarget.value)}
                                    required
                                />
                                <label htmlFor="bersedia">Saya bersedia berpartisipasi dalam penelitian ini dan telah membaca dan memahami penjelasan penelitian di atas.</label>
                            </div>
                        </div>
                        <div className="option">
                            <div className="option-item">
                                <input
                                    type="radio"
                                    id="tidak-bersedia"
                                    name="consent"
                                    value="no"
                                    onChange={(event) => setConsent(event.currentTarget.value)}
                                    aria-describedby="tidak-bersedia-note"
                                    required
                                />
                                <label htmlFor="tidak-bersedia">Saya tidak bersedia berpartisipasi dalam penelitian ini.</label>
                            </div>
                            <p id="tidak-bersedia-note">Anda tetap dapat mengikuti aktivitas berikut dan kami tidak akan menggunakan data Anda dalam penelitian.</p>
                        </div>
                    </div>
                    <ProgressButton className="consent-form-button" disabled={consent === ""}>
                        Lanjutkan
                    </ProgressButton>
                </form>
            </div>
        </main>
    )
}
