import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "What is the speaking evaluation based on?",
      answer: "Our AI evaluates fluency and coherence, grammar accuracy, pronunciation, and vocabulary to ensure consistent and objective scoring. Upon request, we can provide estimated benchmark scores for IELTS, TOEFL, and TOEIC."
    },
    {
      question: "Can I review or override AI-generated scores?",
      answer: "Absolutely. Teachers have full control to review recordings, make edits on feedback to maintain teaching standards and flexibility."
    },
    {
      question: "How do I add my students? Are there any limits?",
      answer: "Students can easily join your class using a class code—no setup needed. You can add as many students as you like without any limits."
    },
    {
      question: "Can I assign a full mock speaking test for my students using Native?",
      answer: "Yes, you can assign a full mock test experience. Native supports English Proficiency Speaking Test simulations such as IELTS, TOEFL, and TOEIC—provided the assignment is set up correctly. This gives students the opportunity to experience the actual test format along with detailed AI feedback"
    },
    {
      question: "How quickly do students receive their speaking feedback?",
      answer: "Students receive detailed AI feedback up to 30 minutes of submitting—eliminating delays from manual grading."
    },
    {
      question: "What is the speaking evaluation based on?",
      answer: "Our AI evaluates fluency and coherence, grammar accuracy, pronunciation, and vocabulary to ensure consistent and objective scoring. Upon request, we can provide estimated benchmark scores for IELTS, TOEFL, and TOEIC."
    },
    {
      question: "Can I review or override AI-generated scores?",
      answer: "Absolutely. Teachers have full control to review recordings, make edits on feedback to maintain teaching standards and flexibility."
    },
    {
      question: "How do I add my students? Are there any limits?",
      answer: "Students can easily join your class using a class code—no setup needed. You can add as many students as you like without any limits."
    },
    {
      question: "Can I assign a full mock speaking test for my students using Native?",
      answer: "Yes, you can assign a full mock test experience. Native supports English Proficiency Speaking Test simulations such as IELTS, TOEFL, and TOEIC—provided the assignment is set up correctly. This gives students the opportunity to experience the actual test format along with detailed AI feedback"
    },
    {
      question: "How quickly do students receive their speaking feedback?",
      answer: "Students receive detailed AI feedback instantly, eliminating delays from manual grading."
    },
 
  ];

  return (
    <section id="faq" className="py-16 bg-inherit">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-secondary">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Native Speaking.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
