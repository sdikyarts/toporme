import Image from "next/image";

export default function Langkah({ active }: { active?: boolean }) {
    return (
        <div className="subchapter-content">
            <div className="subchapter-text">
                <h1>Langkah Topological Sort</h1>
                <ul className="list-decimal space-y-2 pl-5">
                    <li>Tentukan <b>in-degree awal</b> setiap node.</li>
                    <li>Pilih <b>node yang memiliki in-degree 0</b> (tidak memiliki incoming edge).</li>
                    <li>Hapus semua outgoing edge dari node yang telah dipilih tersebut</li>
                    <li>Perbarui in-degree node tujuan dari edge yang dihapus.</li>
                    <li>Ulangi hingga seluruh node berhasil diurutkan.</li>
                </ul>
                <p>
                    <strong>Catatan Penting:</strong><br />
                    Jika <b>beberapa node memiliki in-degree 0</b> dalam suatu DAG, <b>salah satu</b> dari beberapa simpul tersebut <b>boleh dipilih terlebih dahulu</b>, sehingga DAG tersebut <b>memiliki lebih dari satu urutan</b> topological sort.
                </p>
            </div>
            <div className="subchapter-visual">
                <Image
                    src="/langkah-foto.png"
                    loading={active ? "eager" : "lazy"}
                    alt="Ilustrasi topological sort"
                    width={1628}
                    height={964}
                />
                <p>Sumber: https://assets.leetcode.com/users/images/53a3192e-3b39-4003-ab02-ce9299d1e854_1613794475.1125915.png</p>
            </div>
        </div>
    );
}
