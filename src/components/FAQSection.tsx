
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
      answer: "Our AI is calibrated to IELTS band descriptors—assessing fluency and coherence, grammar, pronunciation, and lexical resource—for consistent, objective scoring. However, we do not benchmark the scores directly to IELTS bands."
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
      question: "Can I assign a full IELTS speaking simulation for my students?",
      answer: "Yes. Native supports full IELTS speaking test simulations—Parts 1, 2, and 3—if the assignment is set up correctly. This allows students to experience the real test format with detailed AI feedback."
    },
    {
      question: "How quickly do students receive their speaking feedback?",
      answer: "Students receive detailed AI feedback up to 30 minutes of submitting—eliminating delays from manual grading."
    },
    {
      question: "Can I use Native on my phone?",
      answer: "Not yet. Native is currently optimized for laptop or desktop use via Google Chrome to ensure the best recording and feedback experience."
    }
  ];

  return (
    <section id="faq" className="py-16 bg-inherit">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
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
