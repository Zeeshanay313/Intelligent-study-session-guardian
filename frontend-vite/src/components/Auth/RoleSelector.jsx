import React from 'react'
import { BookOpen, Heart } from 'lucide-react'
import Button from '../UI/Button'

const RoleSelector = ({ selectedRole, onSelectRole }) => {
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl border border-primary-200 dark:border-primary-800/40">
      <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        How would you like to access your account?
      </p>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Student Option */}
        <button
          onClick={() => onSelectRole('student')}
          className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl transition-all border-2 ${
            selectedRole === 'student'
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400'
          }`}
        >
          <BookOpen className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
            selectedRole === 'student' ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'
          }`} />
          <span className={`text-xs sm:text-sm font-semibold ${
            selectedRole === 'student' ? 'text-primary-600' : 'text-gray-700 dark:text-gray-300'
          }`}>
            Student
          </span>
          <span className={`text-xs mt-1 ${
            selectedRole === 'student' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
          }`}>
            Study & Learn
          </span>
        </button>

        {/* Guardian Option */}
        <button
          onClick={() => onSelectRole('guardian')}
          className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl transition-all border-2 ${
            selectedRole === 'guardian'
              ? 'border-accent-600 bg-accent-50 dark:bg-accent-900/30 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-accent-400'
          }`}
        >
          <Heart className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
            selectedRole === 'guardian' ? 'text-accent-600' : 'text-gray-500 dark:text-gray-400'
          }`} />
          <span className={`text-xs sm:text-sm font-semibold ${
            selectedRole === 'guardian' ? 'text-accent-600' : 'text-gray-700 dark:text-gray-300'
          }`}>
            Guardian
          </span>
          <span className={`text-xs mt-1 ${
            selectedRole === 'guardian' ? 'text-accent-500' : 'text-gray-500 dark:text-gray-400'
          }`}>
            Monitor & Guide
          </span>
        </button>
      </div>

      {selectedRole && (
        <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-3">
          {selectedRole === 'student' 
            ? '✓ Accessing student dashboard features'
            : '✓ Accessing guardian dashboard features'}
        </p>
      )}
    </div>
  )
}

export default RoleSelector
