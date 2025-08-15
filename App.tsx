import React, { useState, useMemo, useCallback } from 'react';
import type { Employee } from './types';
import { useEmployees } from './hooks/useEmployees';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import ConfirmationModal from './components/ConfirmationModal';
import FilterControls from './components/FilterControls';

export default function App(): React.ReactNode {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  // State for sorting and filtering
  const [sortKey, setSortKey] = useState<keyof Employee>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [positionFilter, setPositionFilter] = useState<string>('All Positions');

  const handleAddEmployeeClick = useCallback(() => {
    setSelectedEmployee(null);
    setEmployeeModalOpen(true);
  }, []);

  const handleEditEmployee = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    setEmployeeToDelete(id);
    setConfirmModalOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (employeeToDelete) {
      deleteEmployee(employeeToDelete);
      setEmployeeToDelete(null);
      setConfirmModalOpen(false);
    }
  }, [employeeToDelete, deleteEmployee]);

  const handleSaveEmployee = useCallback((employee: Employee) => {
    if (selectedEmployee) {
      updateEmployee(employee);
    } else {
      addEmployee(employee);
    }
    setEmployeeModalOpen(false);
    setSelectedEmployee(null);
  }, [selectedEmployee, addEmployee, updateEmployee]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const uniquePositions = useMemo(() => {
    const positions = new Set(employees.map(e => e.position));
    return ['All Positions', ...Array.from(positions).sort()];
  }, [employees]);

  const processedEmployees = useMemo(() => {
    let result = [...employees];

    // 1. Search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(emp =>
        emp.name.toLowerCase().includes(lowercasedTerm) ||
        emp.email.toLowerCase().includes(lowercasedTerm) ||
        emp.position.toLowerCase().includes(lowercasedTerm) ||
        emp.department.toLowerCase().includes(lowercasedTerm)
      );
    }

    // 2. Position filter
    if (positionFilter && positionFilter !== 'All Positions') {
      result = result.filter(emp => emp.position === positionFilter);
    }

    // 3. Sorting
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [employees, searchTerm, positionFilter, sortKey, sortOrder]);

  return (
    <div className="min-h-screen text-gray-200 font-sans overflow-hidden">
      <Header onAddEmployee={handleAddEmployeeClick} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden animate-app-slide-up opacity-0 ring-1 ring-black ring-opacity-20">
          <div className="p-6 md:p-8 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Employee Roster</h2>
            <p className="mt-1 text-sm text-gray-400">Manage your team's information efficiently.</p>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
              <FilterControls
                sortKey={sortKey}
                onSortKeyChange={(key) => setSortKey(key as keyof Employee)}
                sortOrder={sortOrder}
                onSortOrderChange={handleSortOrderToggle}
                positions={uniquePositions}
                positionFilter={positionFilter}
                onPositionFilterChange={setPositionFilter}
              />
            </div>
            <EmployeeTable
              employees={processedEmployees}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteRequest}
            />
          </div>
        </div>
      </main>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
      />
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this employee record? This action cannot be undone."
      />
    </div>
  );
}