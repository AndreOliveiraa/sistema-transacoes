import { useEffect } from "react";

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = `Transações | ${title}`;

    return () => {
      document.title = "Transações";
    };
  }, [title]);
};

export default useDocumentTitle;
