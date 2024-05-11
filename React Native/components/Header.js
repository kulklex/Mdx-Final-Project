import React from 'react';
import { View, Text } from 'react-native';
import tailwind from 'tailwind-rn';

const Header = ({title}) => {
  return (
    <View style={tailwind('bg-blue-500 px-4 py-6')}>
      <Text style={tailwind('text-white text-center text-xl font-bold')}>
        {title}
      </Text>
    </View>
  );
};

export default Header;
