const urls = {
  credits: {
    "Sem 1": 19.5,
    "Sem 2": 19.5,
    "Sem 3": 21.5,
    "Sem 4": 21.5,
    "Sem 5": 21.5,
    "Sem 6": 21.5,
    "Sem 7": 23,
    "Sem 8": 10,
  },
  2020: {
    "Sem 1":
      "http://123.108.200.171/Results%20R-2020/Semester-I/B.Tech%20I%20Semester%20Regular%20(R-2020)%20(For%202020%20Admitted%20Batch)%20Result%20-%20August-%202021/btechsearch.asp",
    "Sem 2":
      "http://123.108.200.171/Results%20R-2020/Semester-II/B.Tech%20II%20Semester%20Regular%20(R-2020)%20(For%202020%20Admitted%20Batch)%20Result%20-%20September-%202021/btechsearch.asp",
    "Sem 3":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20III%20Semester%20(R-2020)%20(For%202020%20Admitted%20Batch)%20Regular%20Examination%20Result,%20March%202022&lastdaterev=14-05-2022&regulation=R-2020&semester=3",
    "Sem 4":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20IV%20Semester%20(R-2020)%20(for%202020%20admitted%20batch)Regular%20Examination%20results,%20July%20-%202022&regulation=R-2020&semester=4&lastdaterev=13-10-2022",
    "Sem 5":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20V%20Semester%20(R-2020)%20Regular%20Examination%20results,%20December%20-%202022&regulation=R-2020&semester=5&lastdaterev=03-05-2023",
    "Sem 6":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20VI%20Semester%20(R-2020)%20(For%202020%20Admitted%20batches)%20Regular%20Examination%20Results,%20May%20%202023&regulation=R-2020&semester=6&lastdaterev=28-07-2023",
    "Sem 7":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20VII%20Semester%20(R-2020)%20(For%202020%20Admitted%20Batch)%20Regular%20Examinations%20Results,%20November%202023&regulation=R-2020&semester=7&lastdaterev=08-02-2024",
    "Sem 8":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20VIII%20Semester%20(R-2020)%20(For%202020%20Admitted%20Batch)%20Regular%20Examinations%20Results,April-2024&regulation=R-2020&semester=8&lastdaterev=NA",
  },
  2021: {
    "Sem 1":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20I%20Semester%20(R-2020)%20(For%202021%20Admitted%20Batch)%20Regular%20Examination%20results%20,%20April%20-%202022&lastdaterev=20-07-2022&regulation=R-2020&semester=1",
    "Sem 2":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20II%20Semester%20(R-2020)%20(for%202021%20admitted%20batch)%20Regular%20Examination%20results,%20September%20-%202022&regulation=R-2020&semester=2&lastdaterev=07-11-2022",
    "Sem 3":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20III%20Semester%20(R-2020)%20(for%202021%20admitted%20batch)%20Regular%20Examination%20Results,%20January%20%202023&regulation=R-2020&semester=3&lastdaterev=24-05-2023",
    "Sem 4":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20IV%20Semester%20(R-2020)%20(For%202021%20Admitted%20Batches)%20Regular%20Examination%20Results,%20June-2023&regulation=R-2020&semester=4&lastdaterev=27-09-2023",
    "Sem 5":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20V%20Semester%20(R-2020)%20(for%202021%20Admitted%20Batch)%20Regular%20Examination%20Results,%20November%202023&regulation=R-2020&semester=5&lastdaterev=27-01-2024",
    "Sem 6":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.Tech.%20VI%20Semester%20(R-2020)%20(For%202021%20Admitted%20Batch)%20Regular%20Examinations%20Results,%20March-2024&regulation=R-2020&semester=6&lastdaterev=05-06-2024",
  },
  2022: {
    "Sem 1":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20I%20Semester%20(R-2022)%20(For%202022%20Admitted%20batches)%20Regular%20Examination%20Results,%20March%202023&regulation=R-2022&semester=1&lastdaterev=20-07-2023",
    "Sem 2":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20II%20Semester%20(R-2022)%20(For%202022%20Admitted%20Batches)%20Regular%20Examination%20Results,%20August%202023&regulation=R-2022&semester=2&lastdaterev=18-11-2023",
    "Sem 3":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20III%20Semester%20(R-2022)%20(For%202022%20Admitted%20Batches)%20Regular%20Examination%20Results,%20DECEMBER%202023&regulation=R-2022&semester=3&lastdaterev=12-03-2024",
    "Sem 4":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20IV%20Semester%20(R-2022)%20(For%202022%20Admitted%20Batch)%20Regular%20Examinations%20Results,April-2024&regulation=R-2022&semester=4&lastdaterev=01-07-2024",
  },
  2023: {
    "Sem 1":
      "http://gvpce.ac.in:10000/GVP%20Results/RegularResults.jsp?semname=B.%20Tech.%20I%20Semester%20(R-2022)%20(For%202023%20Admitted%20Batches)%20Regular%20Examination%20Results,%20February-2024&regulation=R-2022&semester=1&lastdaterev=12-03-2024",
  },
  // Add more URLs for other batch years and semesters as needed
};

export default urls;
