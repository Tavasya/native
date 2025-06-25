import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, Users, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAssignment } from '@/features/assignments/assignmentThunks';
import { fetchClasses } from '@/features/class/classThunks';

const LibraryTemplateView: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const { user } = useAppSelector(state => state.auth);
  const { profile } = useAppSelector(state => state.auth);
  const { items } = useAppSelector(state => state.library);
  const { classes, loading: classesLoading, error: classesError } = useAppSelector(state => state.classes);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [isAssigning, setIsAssigning] = useState(false);

  // Find the template
  const template = items.find(item => item.id === templateId);

  useEffect(() => {
    if (user && profile?.role) {
      console.log('Fetching classes for user:', user.id, 'role:', profile.role);
      dispatch(fetchClasses({ role: profile.role, userId: user.id }));
    }
  }, [user, profile, dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('Classes state:', { classes, classesLoading, classesError });
  }, [classes, classesLoading, classesError]);

  const handleAssignToClass = async () => {
    if (!template?.assignment || !selectedClass || !dueDate) {
      toast({
        title: "Missing information",
        description: "Please select a class and set a due date",
        variant: "destructive"
      });
      return;
    }

    setIsAssigning(true);
    try {
      const dueDateTime = new Date(`${dueDate}T${dueTime}`);

      const assignmentData = {
        class_id: selectedClass,
        created_by: user?.id || '',
        title: template.title,
        due_date: dueDateTime.toISOString(),
        questions: template.assignment.questions,
        metadata: template.assignment.metadata || { autoGrade: true, isTest: false },
        status: 'not_started' as const
      };

      await dispatch(createAssignment(assignmentData)).unwrap();

      toast({ 
        title: 'Assignment created', 
        description: `"${template.title}" has been assigned to the class successfully` 
      });
      
      // Navigate back to the class page
      navigate(`/class/${selectedClass}`);
    } catch (err: any) {
      toast({
        title: 'Assignment failed',
        description: err?.message || 'Could not create assignment',
        variant: 'destructive'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!template) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Template not found</h3>
            <p className="text-gray-600 mb-4">The template you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/teacher/library')}>
              Back to Library
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/teacher/library')}
            className="text-gray-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.title}</h1>
              <p className="text-gray-600 mb-4">{template.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{template.category}</Badge>
              <Badge variant="outline">Used {template.usage_count} times</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assignment Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.assignment?.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {question.timeLimit === '1' ? '1 minute' : 
                         question.timeLimit === '2' ? '2 minutes' : 
                         question.timeLimit === '3' ? '3 minutes' : 
                         `${parseFloat(question.timeLimit) * 60} seconds`}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{question.question}</p>
                    
                    {question.type === 'bulletPoints' && question.bulletPoints && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">You should say:</h5>
                        <ul className="space-y-1">
                          {question.bulletPoints.map((bullet, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-gray-400 font-bold">•</span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assign to Class Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Assign to Class</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Class Selection */}
                <div className="space-y-2">
                  <Label htmlFor="class">Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        classesLoading ? "Loading classes..." : 
                        classesError ? "Error loading classes" :
                        classes.length === 0 ? "No classes available" :
                        "Choose a class"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {classesLoading ? (
                        <div className="px-2 py-1.5 text-sm text-gray-500">
                          Loading classes...
                        </div>
                      ) : classesError ? (
                        <div className="px-2 py-1.5 text-sm text-red-500">
                          Error: {classesError}
                        </div>
                      ) : classes.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-amber-600">
                          No classes available. Please create a class first.
                        </div>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {classesError && (
                    <p className="text-sm text-red-600 mt-1">
                      Error loading classes: {classesError}
                    </p>
                  )}
                  {!classesLoading && !classesError && classes.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-600 mt-1">
                        You need to create a class first before you can assign templates.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate('/teacher/dashboard')}
                        className="w-full"
                      >
                        Create a Class
                      </Button>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                </div>

                {/* Due Time */}
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Assignment Settings */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Settings</Label>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Auto Grading: {template.assignment?.metadata?.autoGrade ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Test Mode: {template.assignment?.metadata?.isTest ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>

                {/* Assign Button */}
                <Button 
                  onClick={handleAssignToClass}
                  disabled={!selectedClass || !dueDate || isAssigning}
                  className="w-full"
                >
                  {isAssigning ? 'Creating Assignment...' : 'Assign to Class'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LibraryTemplateView; 