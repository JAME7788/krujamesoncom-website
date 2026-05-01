import { db, storage } from "./firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const submitAssignment = async (
  studentId: string,
  studentName: string,
  assignmentTitle: string,
  type: 'link' | 'file',
  content: string | File
) => {
  try {
    let finalContent = content;

    // ถ้าเป็นไฟล์ ให้ทำการอัปโหลดขึ้น Firebase Storage ก่อน
    if (type === 'file' && content instanceof File) {
      const storageRef = ref(storage, `assignments/${studentId}/${Date.now()}_${content.name}`);
      const snapshot = await uploadBytes(storageRef, content);
      finalContent = await getDownloadURL(snapshot.ref);
    }

    const docRef = await addDoc(collection(db, "submissions"), {
      studentId,
      studentName,
      assignmentTitle,
      type,
      content: finalContent,
      status: 'pending', // pending, graded
      score: null,
      feedback: "",
      submittedAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return { success: false, error };
  }
};

export const getStudentSubmissions = async (studentId: string) => {
  const q = query(collection(db, "submissions"), where("studentId", "==", studentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
