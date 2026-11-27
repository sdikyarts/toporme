import Image from "next/image";

export default function Definisi({ active, showIllustration = true }: { active?: boolean; showIllustration?: boolean }) {
    return (
        <div className="subchapter-content">
            <div className="subchapter-text">
                <h1>Apa Itu Topological Sort?</h1>
                <p>Topological sort adalah proses mengurutkan simpul-simpul dalam sebuah graf berarah yang tidak memiliki siklus (DAG) sedemikian hingga simpul yang memiliki ketergantungan (dependency) akan muncul sebelum simpul yang bergantung padanya.</p>
                <ul className="list-disc space-y-2 pl-5">
                    <li>
                        Topological sort adalah algoritma yang <b>mengurutkan nodes/vertices</b> dari sebuah <b>directed acyclic graph (DAG)</b> sedemikian hingga <b>jika ada lintasan di dalam graf dari u ke v</b>, maka <b>u akan muncul sebelum v</b> di dalam urutan tersebut.
                    </li>
                    <li>
                        Setiap DAG memiliki <b>minimal satu topological sort</b>.
                    </li>
                    <li>
                        Sebuah graph yang <b>memiliki cycle, tidak memiliki topological sort</b> karena untuk node/vertex u dan v dalam cycle, maka akan ada lintasan dari u ke v, dan dari v ke u, sehingga setiap urutan simpul yang dibentuk pasti akan kontradiksi dengan salah satu dari lintasan tersebut.
                    </li>
                    <li>
                        Nama lain dari topological sort adalah <b>Algoritma Kahn (Kahn’s Algorithm)</b>, dinamai berdasarkan penemunya, yaitu Arthur B. Kahn, yang menemukan algoritma tersebut pada tahun 1962.
                    </li>
                </ul>
            </div>
            {showIllustration && (
                <div className="subchapter-visual">
                    <Image
                        src="/definisi-foto.png"
                        loading={active ? "eager" : "lazy"}
                        alt="Ilustrasi topological sort"
                        width={1628}
                        height={809}
                    />
                    <p>Sumber: https://ecealgo.com/img/lectures/Lec16/Top.png</p>
                </div>
            )}
        </div>
    );
}
